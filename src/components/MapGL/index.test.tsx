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

  // Regression test for 3.5 (UPGRADE_PLAN.md Section 3.5): `config` used to call
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

  // Regression test for 3.9 (UPGRADE_PLAN.md Section 3.9): `insertLayers`'s off-by-one used to
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
