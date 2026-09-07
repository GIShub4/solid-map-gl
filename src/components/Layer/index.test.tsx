import { describe, it, expect, afterEach } from "vitest";
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
});
