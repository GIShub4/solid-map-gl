import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { Layer } from "./index";
import { Source } from "../Source";
import { MapProvider } from "../MapProvider";
import { renderWithMap } from "../../testUtils/renderWithMap";
import { createMockMap, createMockMapLib, tick } from "../../testUtils/mockMap";

beforeAll(() => {
  // Same stand-in as src/colors.test.ts for what Tailwind's build would generate from a literal
  // "bg-blue-600 dark:bg-blue-400" match — a light rule plus a class-strategy dark rule scoped
  // under an ancestor `.dark`.
  // A third rule scoped by a `data-theme` attribute (no class at all) stands in for an app that
  // configured Tailwind's dark variant that way instead of a `.dark` class — proving the
  // themeVersion re-probe trigger isn't tied to MapGL's own class-based darkMode heuristic.
  const style = document.createElement("style");
  style.textContent = `
    .bg-blue-600 { background-color: rgb(1, 2, 3); }
    .dark .dark\\:bg-blue-400 { background-color: rgb(4, 5, 6); }
    [data-theme="dark"] .dark\\:bg-blue-400 { background-color: rgb(7, 8, 9); }
  `;
  document.head.appendChild(style);
});

afterEach(() => {
  cleanup();
  document.documentElement.style.removeProperty("--color-blue-600");
  document.body.removeAttribute("data-theme");
  document.body.classList.remove("dark");
});

describe("Layer", () => {
  it("buckets a flat style object into paint/layout on addLayer", () => {
    // `iconImage` is in styles.ts's layoutStyles list (→ layout), `iconColor` isn't (→ paint) —
    // both skip the type-name prefix newKey() would otherwise add, since they already start with
    // "icon".
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer
          id="l1"
          style={{
            type: "symbol",
            iconImage: "pin",
            iconColor: "#fff",
          }}
        />
      </Source>
    ));
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].paint).toEqual({ "icon-color": "#fff" });
    expect(call[0].layout).toEqual({ "icon-image": "pin" });
    expect(map.layerIdList).toContain("l1");
  });

  it("resolves a Tailwind color name through its live --color-{name} custom property", () => {
    document.documentElement.style.setProperty("--color-blue-600", "#123456");
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "fill", fillColor: "blue-600", fillOpacity: 1 }} />
      </Source>
    ));
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].paint).toEqual({
      "fill-color": "rgb(18, 52, 86)",
      "fill-opacity": 1,
    });
  });

  it("leaves a Tailwind name unchanged when no matching --color-{name} variable is set", () => {
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "fill", fillColor: "blue-600" }} />
      </Source>
    ));
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].paint).toEqual({ "fill-color": "blue-600" });
  });

  it("resolves a raw oklch() paint color value, not just Tailwind names", () => {
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer
          id="l1"
          style={{ type: "fill", fillColor: "oklch(54.6% 0.245 262.881)" }}
        />
      </Source>
    ));
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    // jsdom doesn't do real oklch conversion (unlike a real browser) — the "54.6%" -> "0.546"
    // normalization it does apply is enough to prove this was routed through resolution rather
    // than left as the literal input string.
    expect(call[0].paint["fill-color"]).not.toBe("oklch(54.6% 0.245 262.881)");
  });

  it("leaves non-Tailwind-name strings on paint color properties untouched", () => {
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "fill", fillColor: "#f00" }} />
      </Source>
    ));
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].paint).toEqual({ "fill-color": "#f00" });
  });

  it("leaves a matching name/shade string untouched on a non-color property", () => {
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "symbol", iconImage: "blue-600" }} />
      </Source>
    ));
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].layout).toEqual({ "icon-image": "blue-600" });
  });

  it("resolves an \"@name\" reference against MapGL's constants prop", () => {
    const { map } = renderWithMap(
      () => (
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer id="l1" style={{ type: "fill", fillColor: "@primary" }} />
        </Source>
      ),
      { constants: { primary: "#123456" } },
    );
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].paint).toEqual({ "fill-color": "#123456" });
  });

  it("resolves a non-color constant (e.g. a shared width) the same way", () => {
    const { map } = renderWithMap(
      () => (
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer id="l1" style={{ type: "line", lineWidth: "@roadWidth" }} />
        </Source>
      ),
      { constants: { roadWidth: 4 } },
    );
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].paint).toEqual({ "line-width": 4 });
  });

  it("chains constant resolution into resolveColor, so a constant can itself be a Tailwind name", () => {
    document.documentElement.style.setProperty("--color-blue-600", "#123456");
    const { map } = renderWithMap(
      () => (
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer id="l1" style={{ type: "fill", fillColor: "@primary" }} />
        </Source>
      ),
      { constants: { primary: "blue-600" } },
    );
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].paint).toEqual({ "fill-color": "rgb(18, 52, 86)" });
  });

  it("leaves an unknown \"@name\" reference unresolved instead of throwing", () => {
    const { map } = renderWithMap(
      () => (
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer id="l1" style={{ type: "fill", fillColor: "@missing" }} />
        </Source>
      ),
      { constants: { primary: "#123456" } },
    );
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].paint).toEqual({ "fill-color": "@missing" });
  });

  it("leaves a literal string starting with @ but with no constants defined untouched", () => {
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "symbol", textField: "@handle" }} />
      </Source>
    ));
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].layout).toEqual({ "text-field": "@handle" });
  });

  it("resolves an \"@name\" reference nested inside a Mapbox expression, not just a bare property value", () => {
    const { map } = renderWithMap(
      () => (
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer
            id="l1"
            style={{
              type: "fill",
              fillColor: ["case", ["boolean", ["feature-state", "hover"], false], "@hoverFill", "#000"],
            }}
          />
        </Source>
      ),
      { constants: { hoverFill: "#123456" } },
    );
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].paint).toEqual({
      "fill-color": ["case", ["boolean", ["feature-state", "hover"], false], "#123456", "#000"],
    });
  });

  it("chains a constant resolved inside an expression into resolveColor, so a Tailwind name works there too", () => {
    document.documentElement.style.setProperty("--color-blue-600", "#123456");
    const { map } = renderWithMap(
      () => (
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer
            id="l1"
            style={{
              type: "fill",
              fillColor: ["case", ["boolean", ["feature-state", "hover"], false], "@hoverFill", "#000"],
            }}
          />
        </Source>
      ),
      { constants: { hoverFill: "blue-600" } },
    );
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].paint).toEqual({
      "fill-color": ["case", ["boolean", ["feature-state", "hover"], false], "rgb(18, 52, 86)", "#000"],
    });
  });

  it("leaves an unknown \"@name\" reference nested inside an expression unresolved instead of throwing", () => {
    const { map } = renderWithMap(
      () => (
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer
            id="l1"
            style={{ type: "fill", fillColor: ["case", ["==", ["get", "x"], 1], "@missing", "#000"] }}
          />
        </Source>
      ),
      { constants: { primary: "#123456" } },
    );
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].paint).toEqual({
      "fill-color": ["case", ["==", ["get", "x"], 1], "@missing", "#000"],
    });
  });

  it("resolves a 'bg-x dark:bg-y' pair to the light class when not in dark mode", () => {
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "fill", fillColor: "bg-blue-600 dark:bg-blue-400" }} />
      </Source>
    ));
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].paint).toEqual({ "fill-color": "rgb(1, 2, 3)" });
  });

  it("resolves a 'bg-x dark:bg-y' pair to the dark class when an ancestor already has the dark class", () => {
    document.body.classList.add("dark");
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "fill", fillColor: "bg-blue-600 dark:bg-blue-400" }} />
      </Source>
    ));
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].paint).toEqual({ "fill-color": "rgb(4, 5, 6)" });
  });

  it("re-probes a 'bg-x dark:bg-y' color when MapGL's themeVersion bumps, with no other change", async () => {
    const [version, setVersion] = createSignal(0);
    const map = createMockMap();
    const mapLib = createMockMapLib();

    render(() => (
      <MapProvider map={map} mapLib={mapLib} themeVersion={version()}>
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer id="l1" style={{ type: "fill", fillColor: "bg-blue-600 dark:bg-blue-400" }} />
        </Source>
      </MapProvider>
    ));

    document.body.classList.add("dark");
    setVersion((v) => v + 1);
    await tick();

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      "l1",
      "fill-color",
      "rgb(4, 5, 6)",
      { validate: false },
    );
  });

  it("re-probes correctly for a data-theme attribute change, not just a class — themeVersion doesn't care which", async () => {
    const [version, setVersion] = createSignal(0);
    const map = createMockMap();
    const mapLib = createMockMapLib();

    render(() => (
      <MapProvider map={map} mapLib={mapLib} themeVersion={version()}>
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer id="l1" style={{ type: "fill", fillColor: "bg-blue-600 dark:bg-blue-400" }} />
        </Source>
      </MapProvider>
    ));

    // No class touched at all — only a data-theme attribute, which MapGL's own darkMode heuristic
    // (used solely for darkStyle switching) wouldn't recognize, but themeVersion doesn't need to.
    document.body.setAttribute("data-theme", "dark");
    setVersion((v) => v + 1);
    await tick();

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      "l1",
      "fill-color",
      "rgb(7, 8, 9)",
      { validate: false },
    );
  });

  it("re-applies every layer referencing a constant when MapGL's constants prop changes", async () => {
    const [primary, setPrimary] = createSignal("#fff");
    const map = createMockMap();
    const mapLib = createMockMapLib();

    render(() => (
      <MapProvider map={map} mapLib={mapLib} constants={{ primary: primary() }}>
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer id="l1" style={{ type: "fill", fillColor: "@primary" }} />
        </Source>
      </MapProvider>
    ));

    setPrimary("#000");
    await tick();

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      "l1",
      "fill-color",
      "#000",
      { validate: false },
    );
  });

  it("diff-based update only touches changed paint/layout properties", async () => {
    const [color, setColor] = createSignal("#fff");
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "fill", fillColor: color(), fillOpacity: 1 }} />
      </Source>
    ));

    setColor("#000");
    await tick();

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      "l1",
      "fill-color",
      "#000",
      { validate: false },
    );
    expect(map.setPaintProperty).not.toHaveBeenCalledWith(
      "l1",
      "fill-opacity",
      expect.anything(),
      expect.anything(),
    );
  });

  it("resolves beforeType to the matching layer's id at add time", () => {
    const map = createMockMap();
    map.getStyle().layers = [{ id: "labels", type: "symbol" }];

    renderWithMap(
      () => (
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer id="l1" style={{ type: "fill" }} beforeType="symbol" />
        </Source>
      ),
      { map },
    );

    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: "l1" }),
      "labels",
    );
  });

  it("passes beforeId straight through when no beforeType is given", () => {
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "fill" }} beforeId="anchor" />
      </Source>
    ));
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: "l1" }),
      "anchor",
    );
  });

  it("calls moveLayer when beforeId changes after mount", async () => {
    const [beforeId, setBeforeId] = createSignal("anchor");
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "fill" }} beforeId={beforeId()} />
      </Source>
    ));
    expect(map.moveLayer).not.toHaveBeenCalled();

    setBeforeId("other");
    await tick();

    expect(map.moveLayer).toHaveBeenCalledWith("l1", "other");
  });

  it("calls moveLayer when beforeType resolves to a different layer id", async () => {
    const map = createMockMap();
    map.getStyle().layers = [{ id: "labels", type: "symbol" }];
    const [beforeType, setBeforeType] = createSignal("symbol");
    renderWithMap(
      () => (
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer id="l1" style={{ type: "fill" }} beforeType={beforeType()} />
        </Source>
      ),
      { map },
    );
    expect(map.moveLayer).not.toHaveBeenCalled();

    map.getStyle().layers = [{ id: "roads", type: "line" }];
    setBeforeType("line");
    await tick();

    expect(map.moveLayer).toHaveBeenCalledWith("l1", "roads");
  });

  it("removes the layer on cleanup", () => {
    const { map, unmount } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "fill" }} />
      </Source>
    ));
    unmount();
    expect(map.removeLayer).toHaveBeenCalledWith("l1");
  });

  it("adds a custom layer as-is (skipping style bucketing) and fires 'load'", () => {
    const customLayer = { id: "c1", type: "custom", render: () => {} } as any;
    const { map } = renderWithMap(() => <Layer customLayer={customLayer} />);
    expect(map.addLayer).toHaveBeenCalledWith(customLayer, undefined);
    expect(map.fire).toHaveBeenCalledWith("load");
    expect(map.layerIdList).toContain("c1");
  });

  it("buckets nested style.paint/style.layout objects, not just flat keys", () => {
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer
          id="l1"
          style={{
            type: "fill",
            paint: { fillColor: "#fff" },
            layout: { visibility: "visible" },
          }}
        />
      </Source>
    ));
    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].paint).toEqual({ "fill-color": "#fff" });
    // `newKey()` still runs over a nested style.layout object, prefixing with the layer type
    // unless the key already starts with it (or "icon"/"text") — it isn't re-checked against
    // `layoutStyles` the way flat top-level keys are.
    expect(call[0].layout).toEqual({ "fill-visibility": "visible" });
  });

  it("wires up a layer event handler and marks the event as coming from this layer", () => {
    const map = createMockMap();
    map.debugEvents = true;
    const onClick = vi.fn();
    renderWithMap(
      () => (
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer id="l1" style={{ type: "fill" }} onClick={onClick} />
        </Source>
      ),
      { map },
    );

    map.fire("click", { lngLat: [0, 0] }, "l1");

    expect(onClick).toHaveBeenCalledWith(
      expect.objectContaining({ clickOnLayer: true }),
    );
  });

  it("does not mark non-click layer events as clickOnLayer", () => {
    const map = createMockMap();
    const onMouseMove = vi.fn();
    renderWithMap(
      () => (
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer id="l1" style={{ type: "fill" }} onMouseMove={onMouseMove} />
        </Source>
      ),
      { map },
    );

    map.fire("mousemove", { lngLat: [0, 0] }, "l1");

    expect(onMouseMove).toHaveBeenCalledWith(
      expect.not.objectContaining({ clickOnLayer: true }),
    );
  });

  it("only re-applies visibility once it actually changes", async () => {
    const [visible, setVisible] = createSignal(true);
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "fill" }} visible={visible()} />
      </Source>
    ));
    expect(map.setLayoutProperty).not.toHaveBeenCalledWith(
      "l1",
      "visibility",
      expect.anything(),
      expect.anything(),
    );

    setVisible(false);
    await tick();

    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      "l1",
      "visibility",
      "none",
      { validate: false },
    );
  });

  it("updates layer zoom range and style.filter reactively", async () => {
    const [minzoom, setMinzoom] = createSignal(0);
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer
          id="l1"
          style={{ type: "fill", minzoom: minzoom(), maxzoom: 10, filter: ["==", "a", 1] }}
        />
      </Source>
    ));

    setMinzoom(3);
    await tick();

    expect(map.setLayerZoomRange).toHaveBeenCalledWith("l1", 3, 10);
  });

  it("updates layout properties via the diff (not just paint)", async () => {
    const [icon, setIcon] = createSignal("pin-a");
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "symbol", iconImage: icon() }} />
      </Source>
    ));

    setIcon("pin-b");
    await tick();

    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      "l1",
      "icon-image",
      "pin-b",
      { validate: false },
    );
  });

  it("applies props.filter (independent of style.filter) via addLayer, without waiting on styledata", async () => {
    // Regression test: an earlier version of this effect gated setFilter behind
    // `!isStyleLoaded() && await map.once("styledata")`, which could hang indefinitely if no
    // further "styledata" event happened to fire. Later, an ungated-but-unconditional setFilter
    // call on mount turned out to have its own failure mode: setFilter (unlike addLayer) throws
    // "Style is not done loading" against a style that's mid-swap — hit in practice by a <Layer>
    // mounted from a <Show> gated on the same flag driving the base style. Fixed by folding
    // props.filter into the addLayer() call itself instead, so a static filter prop never reaches
    // setFilter at all on mount — addLayer tolerates an in-progress style, setFilter doesn't.
    const map = createMockMap();
    map.isStyleLoaded.mockReturnValue(false);
    renderWithMap(
      () => (
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer id="l1" style={{ type: "fill" }} filter={["==", "a", 1] as any} />
        </Source>
      ),
      { map },
    );
    await tick();

    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].filter).toEqual(["==", "a", 1]);
    expect(map.setFilter).not.toHaveBeenCalled();
  });

  it("clears props.filter on the map once it goes back to undefined after having been set", async () => {
    const [filter, setFilter] = createSignal<any>(["==", "a", 1]);
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "fill" }} filter={filter()} />
      </Source>
    ));
    await tick();
    // The initial value is applied via addLayer (see the test above), not setFilter — only a real
    // change after mount goes through setFilter.
    expect(map.setFilter).not.toHaveBeenCalled();

    setFilter(undefined);
    await tick();

    expect(map.setFilter).toHaveBeenLastCalledWith("l1", null);
  });

  it("never touches the map filter when props.filter is never used, so style.filter isn't clobbered", async () => {
    const { map } = renderWithMap(() => (
      <Source id="src" source={{ type: "geojson", data: {} as any }}>
        <Layer id="l1" style={{ type: "fill", filter: ["==", "a", 1] }} />
      </Source>
    ));
    await tick();

    const call = map.addLayer.mock.calls.find((c: any[]) => c[0].id === "l1");
    expect(call[0].filter).toEqual(["==", "a", 1]);
    expect(map.setFilter).not.toHaveBeenCalled();
  });

  it("sets and clears feature state", async () => {
    const map = createMockMap();
    renderWithMap(
      () => (
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer
            id="l1"
            style={{ type: "fill", "source-layer": "sl" } as any}
            featureState={{ id: 1, state: { hover: true } }}
          />
        </Source>
      ),
      { map },
    );
    await tick();

    expect(map.removeFeatureState).toHaveBeenCalledWith({
      source: "src",
      sourceLayer: "sl",
    });
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: "src", sourceLayer: "sl", id: 1 },
      { hover: true },
    );
  });

  it("swallows a mid-style-swap 'Style is not done loading' throw from feature state updates instead of crashing", async () => {
    // Regression test: this effect used to gate on `!isStyleLoaded() && await
    // once("styledata")`, which could hang indefinitely (see the "no isStyleLoaded()/styledata
    // gating" comments elsewhere in this file for why) instead of the map's actual, load-bearing
    // failure mode here — removeFeatureState/setFeatureState throwing synchronously when a style
    // swap (e.g. ProvinceLayer.tsx mounted alongside a satellite toggle) is still in flight.
    const map = createMockMap();
    map.setFeatureState.mockImplementationOnce(() => {
      throw new Error("Style is not done loading");
    });
    const [hoveredId, setHoveredId] = createSignal(1);
    renderWithMap(
      () => (
        <Source id="src" source={{ type: "geojson", data: {} as any }}>
          <Layer
            id="l1"
            style={{ type: "fill", "source-layer": "sl" } as any}
            featureState={{ id: hoveredId(), state: { hover: true } }}
          />
        </Source>
      ),
      { map },
    );
    await tick();

    // The throwing call was reached and swallowed — not skipped outright.
    expect(map.setFeatureState).toHaveBeenCalledTimes(1);

    // A later, unrelated hover change still goes through normally — nothing was left stuck.
    setHoveredId(2);
    await tick();

    expect(map.setFeatureState).toHaveBeenLastCalledWith(
      { source: "src", sourceLayer: "sl", id: 2 },
      { hover: true },
    );
  });

  it("resets to `from` with no transition as soon as pulse is set, synchronously", async () => {
    const map = createMockMap();
    renderWithMap(
      () => (
        <Layer
          id="l1"
          style={{ type: "circle" }}
          pulse={{ property: "circle-radius", from: 0, to: 20, duration: 1000 }}
        />
      ),
      { map },
    );
    await tick();

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      "l1",
      "circle-radius-transition",
      { duration: 0, delay: 0 },
      { validate: false },
    );
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      "l1",
      "circle-radius",
      0,
      { validate: false },
    );
  });

  it("hands the ramp to `to` off to Mapbox's own transition one frame later, not a per-frame loop", async () => {
    let raf: FrameRequestCallback | undefined;
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb) => {
        raf = cb;
        return 0;
      });
    const map = createMockMap();
    renderWithMap(
      () => (
        <Layer
          id="l1"
          style={{ type: "circle" }}
          // holdFraction 0.25 (default) -> ramp gets 75% of the 1000ms cycle = 750ms.
          pulse={{ property: "circle-radius", from: 0, to: 20, duration: 1000 }}
        />
      ),
      { map },
    );
    await tick();

    expect(raf).toBeTruthy();
    // Nothing beyond the synchronous reset has happened yet — the ramp is still one frame away.
    expect(map.setPaintProperty).not.toHaveBeenCalledWith(
      "l1",
      "circle-radius",
      20,
      { validate: false },
    );

    raf!(0);

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      "l1",
      "circle-radius-transition",
      { duration: 750, delay: 0 },
      { validate: false },
    );
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      "l1",
      "circle-radius",
      20,
      { validate: false },
    );

    rafSpy.mockRestore();
  });

  it("repeats the beat every `duration` ms via setInterval, not a continuous frame loop", async () => {
    let beat: (() => void) | undefined;
    const intervalSpy = vi
      .spyOn(window, "setInterval")
      .mockImplementation((cb: any) => {
        beat = cb;
        return 7 as any;
      });
    const map = createMockMap();
    renderWithMap(
      () => (
        <Layer
          id="l1"
          style={{ type: "circle" }}
          pulse={{ property: "circle-radius", from: 0, to: 20, duration: 1000 }}
        />
      ),
      { map },
    );
    await tick();

    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
    map.setPaintProperty.mockClear();

    beat!(); // simulate the interval firing again for the next cycle

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      "l1",
      "circle-radius",
      0,
      { validate: false },
    );

    intervalSpy.mockRestore();
  });

  it("stops every pulse interval on cleanup", async () => {
    let nextId = 1;
    const intervalSpy = vi
      .spyOn(window, "setInterval")
      .mockImplementation(() => nextId++ as any);
    const clearSpy = vi.spyOn(window, "clearInterval").mockImplementation(() => {});
    const map = createMockMap();
    const { unmount } = renderWithMap(
      () => (
        <Layer
          id="l1"
          style={{ type: "circle" }}
          pulse={[
            { property: "circle-radius", from: 0, to: 20 },
            { property: "circle-color", from: "rgba(200,0,0,1)", to: "rgba(200,0,0,0)" },
          ]}
        />
      ),
      { map },
    );
    await tick();
    unmount();

    expect(clearSpy).toHaveBeenCalledWith(1);
    expect(clearSpy).toHaveBeenCalledWith(2);

    intervalSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("does not start a pulse when the prop is unset", async () => {
    const intervalSpy = vi.spyOn(window, "setInterval");
    const map = createMockMap();
    renderWithMap(() => <Layer id="l1" style={{ type: "fill" }} />, { map });
    await tick();

    expect(intervalSpy).not.toHaveBeenCalled();
    intervalSpy.mockRestore();
  });

  it("drives multiple paint properties off independent intervals, all started together", async () => {
    const intervalSpy = vi.spyOn(window, "setInterval");
    const map = createMockMap();
    renderWithMap(
      () => (
        <Layer
          id="l1"
          style={{ type: "circle" }}
          pulse={[
            { property: "circle-radius", from: 0, to: 20, duration: 1000 },
            { property: "circle-color", from: "rgba(200,0,0,1)", to: "rgba(200,0,0,0)", duration: 1000 },
          ]}
        />
      ),
      { map },
    );
    await tick();

    // One interval per config, not one shared loop — but both fire their first beat synchronously
    // together, so the two properties stay visually in lockstep.
    expect(intervalSpy).toHaveBeenCalledTimes(2);
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      "l1",
      "circle-radius",
      0,
      { validate: false },
    );
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      "l1",
      "circle-color",
      "rgba(200,0,0,1)",
      { validate: false },
    );

    intervalSpy.mockRestore();
  });

  it("derives the ramp duration from `duration` and `holdFraction`", async () => {
    let raf: FrameRequestCallback | undefined;
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb) => {
        raf = cb;
        return 0;
      });
    const map = createMockMap();
    renderWithMap(
      () => (
        <Layer
          id="l1"
          style={{ type: "circle" }}
          // Half the cycle held -> half spent ramping.
          pulse={{ property: "circle-radius", from: 0, to: 20, duration: 1000, holdFraction: 0.5 }}
        />
      ),
      { map },
    );
    await tick();
    raf!(0);

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      "l1",
      "circle-radius-transition",
      { duration: 500, delay: 0 },
      { validate: false },
    );

    rafSpy.mockRestore();
  });

  it("resolves a *-color property's from/to through the same Tailwind-name resolution as any other paint color", async () => {
    document.documentElement.style.setProperty("--color-blue-600", "#2563eb");
    const map = createMockMap();
    renderWithMap(
      () => (
        <Layer
          id="l1"
          style={{ type: "circle" }}
          pulse={{ property: "circle-color", from: "blue-600", to: "blue-600" }}
        />
      ),
      { map },
    );
    await tick();

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      "l1",
      "circle-color",
      "rgb(37, 99, 235)",
      { validate: false },
    );
  });

  it("leaves a plain numeric property's from/to untouched (only *-color properties resolve)", async () => {
    const map = createMockMap();
    renderWithMap(
      () => (
        <Layer
          id="l1"
          style={{ type: "circle" }}
          pulse={{ property: "circle-radius", from: 0, to: 20 }}
        />
      ),
      { map },
    );
    await tick();

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      "l1",
      "circle-radius",
      0,
      { validate: false },
    );
  });
});
