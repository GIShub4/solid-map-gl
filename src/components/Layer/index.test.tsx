import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { Layer } from "./index";
import { Source } from "../Source";
import { renderWithMap } from "../../testUtils/renderWithMap";
import { createMockMap, tick } from "../../testUtils/mockMap";

afterEach(cleanup);

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

  it("applies props.filter (independent of style.filter), awaiting styledata if not yet loaded", async () => {
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
    map.fire("styledata", {});
    await tick();

    expect(map.setFilter).toHaveBeenCalledWith("l1", ["==", "a", 1]);
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
});
