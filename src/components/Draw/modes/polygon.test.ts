import { describe, it, expect, vi } from "vitest";
import createPolygonMode from "./polygon";

describe("polygon mode", () => {
  const ring = [
    [0, 0],
    [0.01, 0],
    [0.01, 0.01],
    [0, 0],
  ];

  const makeMode = () => {
    const toDisplayFeatures = vi.fn((state, geojson, displayMeasure) =>
      displayMeasure(geojson),
    );
    const lib = { modes: { draw_polygon: { toDisplayFeatures } } };
    return { mode: createPolygonMode(lib), base: toDisplayFeatures };
  };

  it("always displays the base geojson, delegating to the underlying draw_polygon mode", () => {
    const { mode, base } = makeMode();
    const display = vi.fn();
    const ctx = { drawConfig: { userProperties: {} } };
    const geojson = { geometry: { coordinates: [ring] } };

    mode.toDisplayFeatures.call(ctx, { some: "state" }, geojson, display);

    expect(base).toHaveBeenCalled();
    expect(display).toHaveBeenCalledWith(geojson);
    expect(display).toHaveBeenCalledTimes(1);
  });

  it("adds one length label per subsequent vertex when showLength is enabled", () => {
    const { mode } = makeMode();
    const display = vi.fn();
    const ctx = { drawConfig: { userProperties: { showLength: true } } };
    const geojson = { geometry: { coordinates: [ring] } };

    mode.toDisplayFeatures.call(ctx, {}, geojson, display);

    // base geojson + (ring.length - 1) segment labels
    expect(display).toHaveBeenCalledTimes(1 + (ring.length - 1));
  });

  it("adds an area label once the ring has at least 3 points and showArea is enabled", () => {
    const { mode } = makeMode();
    const display = vi.fn();
    const ctx = { drawConfig: { userProperties: { showArea: true } } };
    const geojson = { geometry: { coordinates: [ring] } };

    mode.toDisplayFeatures.call(ctx, {}, geojson, display);

    const areaCall = display.mock.calls.find(
      ([feature]) => feature?.geometry?.type === "Point",
    );
    expect(areaCall).toBeTruthy();
  });

  it("skips the area label when the ring has fewer than 3 points", () => {
    const { mode } = makeMode();
    const display = vi.fn();
    const ctx = { drawConfig: { userProperties: { showArea: true } } };
    const geojson = { geometry: { coordinates: [[[0, 0], [1, 0]]] } };

    mode.toDisplayFeatures.call(ctx, {}, geojson, display);

    expect(display).toHaveBeenCalledTimes(1);
  });
});
