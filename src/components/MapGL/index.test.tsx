import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import MapGL from "../..";
import { Layer } from "../Layer";
import { Source } from "../Source";
import { createMockMapLib, tick } from "../../testUtils/mockMap";

afterEach(cleanup);

const waitForLoad = async () => {
  await tick();
  await tick();
  await tick();
};

describe("Map", () => {
  // Real mapbox-gl construction depends on a real WebGL context, which jsdom doesn't provide —
  // `mapLib.supported()` reliably returns false here, so these smoke tests use the same mock
  // `mapLib` as everything else instead of the real library (Section 7.1's whole rationale for
  // the hand-rolled mock in the first place).
  it("renders", () => {
    const { container, unmount } = render(() => (
      <MapGL mapLib={createMockMapLib()} options={{ testMode: true }}></MapGL>
    ));
    expect(container.innerHTML).toMatchSnapshot();
    unmount();
  });

  it("renders with static viewport", () =>
    render(() => (
      <MapGL mapLib={createMockMapLib()} viewport={{ center: [0, 0], zoom: 5 }}></MapGL>
    )));

  it("calls setConfigProperty for each config key on a Mapbox-shaped map", async () => {
    const mapLib = createMockMapLib({ isMapLibre: false });
    render(() => (
      <MapGL mapLib={mapLib} config={{ lightPreset: "dawn", showPlaceLabels: false }} />
    ));
    await waitForLoad();

    const map = mapLib.Map.instances[0];
    expect(map.setConfigProperty).toHaveBeenCalledWith("basemap", "lightPreset", "dawn");
    expect(map.setConfigProperty).toHaveBeenCalledWith(
      "basemap",
      "showPlaceLabels",
      false,
    );
  });

  // Regression test: the config effect used to be created with `createEffect(...)` *inside*
  // `map.once("load", () => {...})`, itself inside an async `onMount`. By the time that callback
  // runs, execution has crossed an await/event-callback boundary and left Solid's synchronous
  // owner tree, so the effect had no owner to dispose it — Solid's dev build warns
  // "computations created outside a `createRoot` or `render` will never be disposed" for exactly
  // this pattern. Moving the effect to the component's top level (reactively gated on the
  // mapLoaded() signal instead of the plain `map` variable) keeps it inside the owner tree.
  it("does not warn about computations created outside createRoot when applying config after load", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mapLib = createMockMapLib({ isMapLibre: false });
    render(() => (
      <MapGL mapLib={mapLib} config={{ lightPreset: "dawn" }} />
    ));
    await waitForLoad();

    const disposalWarnings = warnSpy.mock.calls.filter((args) =>
      args.some((a) => typeof a === "string" && a.includes("will never be disposed")),
    );
    expect(disposalWarnings).toEqual([]);
    warnSpy.mockRestore();
  });

  // Regression test: `config` used to call
  // `setConfigProperty` unconditionally, throwing `TypeError: ... is not a function` on
  // MapLibre. The guard should make this a silent no-op instead.
  it("is a no-op (not a throw) for the config prop on a MapLibre-shaped map (3.5)", async () => {
    const mapLib = createMockMapLib({ isMapLibre: true });
    expect(() => {
      render(() => <MapGL mapLib={mapLib} config={{ lightPreset: "dawn" }} />);
    }).not.toThrow();
    await waitForLoad();

    const map = mapLib.Map.instances[0];
    expect((map as any).setConfigProperty).toBeUndefined();
  });

  it("fires onViewportChange on a synthetic move/moveend", async () => {
    const mapLib = createMockMapLib();
    const events: string[] = [];
    render(() => (
      <MapGL mapLib={mapLib} onViewportChange={() => events.push("change")} />
    ));
    await waitForLoad();

    const map = mapLib.Map.instances[0];
    map.fire("move", {});
    map.fire("moveend", {});

    expect(events).toEqual(["change", "change"]);
  });

  // Regression test: `insertLayers`'s off-by-one used to
  // replace the layer matched by `beforeType` instead of inserting before it, so of two consumer
  // layers anchored to the same `beforeType`, only the first survived a style swap. Assert both
  // survive now.
  it("re-inserts every consumer layer anchored to the same beforeType after a style swap (3.9)", async () => {
    const mapLib = createMockMapLib();
    const [style, setStyle] = createSignal<any>(undefined);
    render(() => (
      <MapGL mapLib={mapLib} options={{ style: style() }}>
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer id="a" style={{ type: "fill" }} beforeType="symbol" />
          <Layer id="b" style={{ type: "line" }} beforeType="symbol" />
        </Source>
      </MapGL>
    ));
    await waitForLoad();

    const map = mapLib.Map.instances[0];
    // Base style, right before the swap, contains the two consumer layers plus one basemap
    // layer of the anchor type — mirroring what MapGL's effect reads via oldStyle.layers.
    map.getStyle().layers = [
      { id: "a", type: "fill", metadata: { smg: { beforeType: "symbol" } } },
      { id: "b", type: "line", metadata: { smg: { beforeType: "symbol" } } },
      { id: "labels", type: "symbol" },
    ];

    // Trigger MapGL's style-swap effect via a reactive options.style change.
    setStyle({ version: 8, sources: {}, layers: [{ id: "labels", type: "symbol" }] });
    await tick();
    // The effect calls map.setStyle(newStyle) then registers a once("styledata", ...) merge —
    // fire it manually since the mock doesn't emit styledata on its own.
    map.getStyle.mockReturnValue({ version: 8, sources: {}, layers: [{ id: "labels", type: "symbol" }] });
    map.fire("styledata");
    await tick();

    // After the merge, MapGL's final setStyle call's layers must still contain both "a" and
    // "b" — not just the first one, which was the pre-fix off-by-one's failure mode.
    const finalCall = map.setStyle.mock.calls[map.setStyle.mock.calls.length - 1][0];
    const ids = (finalCall.layers || []).map((l: any) => l.id);
    expect(ids).toEqual(expect.arrayContaining(["a", "b"]));
  });

  it("calls map.remove() on cleanup", async () => {
    const mapLib = createMockMapLib();
    const { unmount } = render(() => <MapGL mapLib={mapLib} />);
    await waitForLoad();
    const map = mapLib.Map.instances[0];
    unmount();
    expect(map.remove).toHaveBeenCalled();
  });

  it("resolves an 'mb:light' style shorthand to its full mapbox:// style URL", async () => {
    const mapLib = createMockMapLib();
    const ctorSpy = vi.spyOn(mapLib, "Map");
    render(() => <MapGL mapLib={mapLib} options={{ style: "mb:light" }} />);
    await waitForLoad();

    expect(ctorSpy.mock.calls[0][0].style).toContain("light-v11");
  });

  it("dispatches a function-form map event prop after a click that isn't from a layer", async () => {
    const mapLib = createMockMapLib();
    const onClick = vi.fn();
    render(() => <MapGL mapLib={mapLib} onClick={onClick} />);
    await waitForLoad();
    const map = mapLib.Map.instances[0];

    map.fire("click", { lngLat: [0, 0] });
    await new Promise((r) => setTimeout(r, 10));

    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ lngLat: [0, 0] }));
  });

  it("ignores a function-form map event that originated from a layer", async () => {
    const mapLib = createMockMapLib();
    const onClick = vi.fn();
    render(() => <MapGL mapLib={mapLib} onClick={onClick} />);
    await waitForLoad();
    const map = mapLib.Map.instances[0];

    map.fire("click", { lngLat: [0, 0], clickOnLayer: true });
    await new Promise((r) => setTimeout(r, 10));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("dispatches an object-form (per-layer) map event prop", async () => {
    const mapLib = createMockMapLib();
    const onLayerClick = vi.fn();
    render(() => <MapGL mapLib={mapLib} onClick={{ myLayer: onLayerClick }} />);
    await waitForLoad();
    const map = mapLib.Map.instances[0];

    map.fire("click", { lngLat: [1, 1] }, "myLayer");
    await new Promise((r) => setTimeout(r, 10));

    expect(onLayerClick).toHaveBeenCalledWith(
      expect.objectContaining({ lngLat: [1, 1] }),
    );
  });

  it("reports user interaction start via onUserInteraction", async () => {
    const mapLib = createMockMapLib();
    const onUserInteraction = vi.fn();
    render(() => <MapGL mapLib={mapLib} onUserInteraction={onUserInteraction} />);
    await waitForLoad();
    const map = mapLib.Map.instances[0];

    map.fire("mousedown", {});

    expect(onUserInteraction).toHaveBeenCalledWith(true);
  });

  it("switches darkStyle in when the OS-level color scheme changes", async () => {
    let changeListener: (() => void) | undefined;
    const matches = { current: false };
    const origMatchMedia = window.matchMedia;
    // @ts-ignore
    window.matchMedia = () => ({
      get matches() {
        return matches.current;
      },
      addEventListener: (_: string, cb: () => void) => {
        changeListener = cb;
      },
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    });

    const mapLib = createMockMapLib();
    render(() => <MapGL mapLib={mapLib} />);
    await waitForLoad();

    expect(changeListener).toBeTruthy();
    matches.current = true;
    changeListener!();

    window.matchMedia = origMatchMedia;
  });

  it("picks up a 'dark' class toggle on document.body via MutationObserver", async () => {
    const mapLib = createMockMapLib();
    render(() => <MapGL mapLib={mapLib} />);
    await waitForLoad();

    document.body.classList.add("dark");
    await new Promise((r) => setTimeout(r, 10));
    document.body.classList.remove("dark");
  });

  it("resizes the map (debounced) when its container's ResizeObserver fires", async () => {
    let roCallback: (() => void) | undefined;
    const OrigRO = window.ResizeObserver;
    // @ts-ignore
    window.ResizeObserver = class {
      constructor(cb: () => void) {
        roCallback = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    const mapLib = createMockMapLib();
    render(() => <MapGL mapLib={mapLib} />);
    await waitForLoad();
    const map = mapLib.Map.instances[0];

    expect(roCallback).toBeTruthy();
    roCallback!();
    await new Promise((r) => setTimeout(r, 10));

    expect(map.resize).toHaveBeenCalled();
    window.ResizeObserver = OrigRO;
  });

  // Regression test: the injected `.overlay>*{pointer-events:auto}` rule used to have equal
  // specificity to a consumer's own `pointer-events-none` class and lost only by source order,
  // so a direct MapGL child could never opt back into being click-through. Wrapping the selector
  // in :where() drops it to zero specificity so any consumer class selector wins outright.
  it("scopes the injected overlay pointer-events rule with :where() so consumers can override it", async () => {
    const mapLib = createMockMapLib();
    const { container } = render(() => (
      <MapGL mapLib={mapLib}>
        <div class="my-widget" />
      </MapGL>
    ));
    await waitForLoad();

    const style = container.querySelector("style");
    expect(style?.textContent).toContain(":where(.overlay>*)");
    // The bare (unscoped, equal-specificity) selector must be gone, not just supplemented.
    expect(style?.textContent).not.toContain("}.overlay>*{");
  });

  // Regression test: Mapbox's real `map.stop()` synchronously fires `moveend` for the animation
  // it cancels. That used to flow straight into `onViewportChange`, which (in a typical consumer)
  // writes back into the same `viewport` prop this effect is subscribed to — re-entering the
  // effect before the current run returns and recursing until the call stack overflowed. The
  // `interruptingEase` flag should suppress just that synthetic moveend.
  it("does not call onViewportChange for the moveend synchronously fired by stop() when interrupting an ease", async () => {
    const mapLib = createMockMapLib();
    const [viewport, setViewport] = createSignal<any>({ center: [0, 0], zoom: 5 });
    const onViewportChange = vi.fn();
    render(() => (
      <MapGL mapLib={mapLib} viewport={viewport()} onViewportChange={onViewportChange} />
    ));
    await waitForLoad();
    const map = mapLib.Map.instances[0];

    // Mirror Mapbox's real stop(): synchronously fire moveend for the ease being cancelled.
    map.stop.mockImplementation(() => {
      map.fire("moveend", {});
      return map;
    });

    expect(() => setViewport({ center: [1, 1], zoom: 8 })).not.toThrow();
    await tick();

    expect(onViewportChange).not.toHaveBeenCalled();
    expect(map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [1, 1], zoom: 8 }),
    );
  });

  // Regression test: the effect used to gate on a coarse `internal()` "an animation is in
  // flight" boolean, which the "move" handler set on every animation frame — including frames
  // from its own programmatic flyTo. A typical consumer's onViewportChange writes straight back
  // into the same store field this effect reads, so every one of those frames re-triggered the
  // effect; without generation tagging it would try to restart the ease on every single frame.
  it("does not restart the ease when its own move progress echoes back through onViewportChange", async () => {
    const mapLib = createMockMapLib();
    const [viewport, setViewport] = createSignal<any>({ center: [0, 0], zoom: 5 });
    render(() => (
      <MapGL mapLib={mapLib} viewport={viewport()} onViewportChange={setViewport} />
    ));
    await waitForLoad();
    const map = mapLib.Map.instances[0];

    setViewport({ center: [1, 1], zoom: 8 });
    await tick();
    expect(map.flyTo).toHaveBeenCalledTimes(1);

    // Simulate several animation frames of the ease that was just started — this is exactly
    // what a real Mapbox "move" event does, many times per second, for a programmatic flyTo.
    map.fire("move", {});
    await tick();
    map.fire("move", {});
    await tick();

    // None of that self-generated progress should have restarted the ease — stop() should
    // still show only the one call from the initial command, not a second one from an echo.
    expect(map.stop).toHaveBeenCalledTimes(1);
    expect(map.flyTo).toHaveBeenCalledTimes(1);
  });

  // Regression test: with the old `internal()` gate, a genuinely new target arriving while an
  // ease was still in flight was silently dropped — the effect returned early instead of
  // interrupting. The map only ever caught up once the *original* ease naturally finished: real
  // moveend fired, spread the (by-then-stale-or-final) props.viewport back through
  // onViewportChange, and only *that* re-trigger (with internal() finally false) actually
  // issued the correct flyTo. Confirmed live: this made every interrupted switch cost roughly
  // 2x a normal ease (one wasted cycle, then the real one) instead of interrupting immediately.
  it("immediately interrupts an in-flight ease when a genuinely new target arrives, instead of waiting for the current one to settle", async () => {
    const mapLib = createMockMapLib();
    const [viewport, setViewport] = createSignal<any>({ center: [0, 0], zoom: 5 });
    render(() => (
      <MapGL mapLib={mapLib} viewport={viewport()} onViewportChange={setViewport} />
    ));
    await waitForLoad();
    const map = mapLib.Map.instances[0];

    setViewport({ center: [1, 1], zoom: 8 });
    await tick();
    expect(map.flyTo).toHaveBeenCalledTimes(1);

    // The first ease is still in flight (no moveend yet) — a "move" frame or two land first,
    // exactly as they would mid-animation.
    map.fire("move", {});
    await tick();

    // Now a genuinely new target arrives — e.g. the user picked a different province before the
    // first flyTo settled. This must interrupt right away, not wait for the first ease's moveend.
    setViewport({ center: [9, 9], zoom: 3 });
    await tick();

    // Two commands total (the initial one, then the interrupt) means two stop()+flyTo pairs —
    // not one wasted cycle followed by a corrective second one once the first ease's real
    // moveend happened to fire, which was the old ~2x-cost behavior.
    expect(map.stop).toHaveBeenCalledTimes(2);
    expect(map.flyTo).toHaveBeenCalledTimes(2);
    expect(map.flyTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ center: [9, 9], zoom: 3 }),
    );
  });

  // Regression test for a real bug found live in tb-mapper: an earlier version of this fix
  // tagged the *viewport value itself* (a Symbol-keyed field) to tell a self-echo apart from a
  // new request. That broke the moment a consumer did the extremely common
  // `setStore({ viewport: { ...store.viewport, bounds: newBounds } })` — spreading the *current*
  // (recently-echoed) viewport forward and only overriding one field, exactly like a province
  // dropdown updating just `bounds`. The spread carried the tag along for the ride, so the new
  // selection looked like an echo of itself and was silently dropped — confirmed live: 7 rapid
  // province clicks produced zero flyTo calls. The fix must not depend on any field surviving a
  // consumer's own spread/merge of the previous viewport.
  it("still treats a new request as new even when the consumer builds it by spreading the just-echoed viewport", async () => {
    const mapLib = createMockMapLib();
    const [viewport, setViewport] = createSignal<any>({ center: [0, 0], zoom: 5 });
    render(() => (
      <MapGL mapLib={mapLib} viewport={viewport()} onViewportChange={setViewport} />
    ));
    await waitForLoad();
    const map = mapLib.Map.instances[0];

    setViewport({ bounds: [[0, 0], [1, 1]] });
    await tick();
    expect(map.flyTo).toHaveBeenCalledTimes(1);

    // Let the ease settle for real, so props.viewport now holds exactly what our own moveend
    // handler produced (the shape a consumer's store would hold afterward).
    map.fire("moveend", {});
    await tick();

    // A brand-new selection built the way a real dropdown handler does: spread the *current*
    // (just-echoed) viewport and override only `bounds`.
    const current = viewport();
    setViewport({ ...current, bounds: [[5, 5], [6, 6]] });
    await tick();

    expect(map.flyTo).toHaveBeenCalledTimes(2);
    expect(map.flyTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ bounds: [[5, 5], [6, 6]] }),
    );
  });

  it("applies a reactive viewport update once it changes after mount", async () => {
    const mapLib = createMockMapLib();
    const [viewport, setViewport] = createSignal<any>({ center: [0, 0], zoom: 5 });
    render(() => <MapGL mapLib={mapLib} viewport={viewport()} />);
    await waitForLoad();
    const map = mapLib.Map.instances[0];

    setViewport({ center: [1, 1], zoom: 8 });
    await tick();

    expect(map.stop).toHaveBeenCalled();
    expect(map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [1, 1], zoom: 8 }),
    );
  });

  it("updates the map projection reactively", async () => {
    const mapLib = createMockMapLib();
    const [projection, setProjection] = createSignal("mercator");
    render(() => <MapGL mapLib={mapLib} options={{ projection: projection() } as any} />);
    await waitForLoad();
    const map = mapLib.Map.instances[0];

    setProjection("globe");
    await tick();

    expect(map.setProjection).toHaveBeenCalledWith("globe");
  });

  it("updates the map cursor reactively", async () => {
    const mapLib = createMockMapLib();
    const [cursor, setCursor] = createSignal<string | undefined>(undefined);
    render(() => <MapGL mapLib={mapLib} cursorStyle={cursor()} />);
    await waitForLoad();
    const map = mapLib.Map.instances[0];
    const canvas = { style: {} as any };
    map.getCanvas.mockReturnValue(canvas);

    setCursor("pointer");
    await tick();

    expect(canvas.style.cursor).toBe("pointer");
  });

  it("carries over old sources (matching sourceIdList) across a style swap", async () => {
    const mapLib = createMockMapLib();
    const [style, setStyle] = createSignal<any>(undefined);
    render(() => (
      <MapGL mapLib={mapLib} options={{ style: style() }}>
        <Source id="src" source={{ type: "geojson", data: {} as any }} />
      </MapGL>
    ));
    await waitForLoad();
    const map = mapLib.Map.instances[0];

    map.getStyle.mockReturnValue({
      layers: [],
      sources: { src: { type: "geojson", data: {} } },
    });

    setStyle({ version: 8, sources: {}, layers: [] });
    await tick();
    map.getStyle.mockReturnValue({ layers: [], sources: {} });
    map.fire("styledata");
    await tick();

    const finalCall = map.setStyle.mock.calls[map.setStyle.mock.calls.length - 1][0];
    expect(finalCall.sources).toHaveProperty("src");
  });

  it("turns on debug rendering flags reactively", async () => {
    const mapLib = createMockMapLib();
    const [show, setShow] = createSignal(false);
    render(() => <MapGL mapLib={mapLib} showTileBoundaries={show()} />);
    await waitForLoad();
    const map = mapLib.Map.instances[0];

    setShow(true);
    await tick();

    expect((map as any).showTileBoundaries).toBe(true);
  });
});
