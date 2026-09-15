import { describe, it, expect, vi } from "vitest";
import MultiPointMode from "./multi_point";

describe("multi_point mode", () => {
  it("defaults count to 0 when not given", () => {
    expect(MultiPointMode.onSetup({})).toEqual({ count: 0 });
  });

  it("carries opts.count into state", () => {
    expect(MultiPointMode.onSetup({ count: 5 })).toEqual({ count: 5 });
  });

  it("creates and adds a point feature tagged with the current count on click", () => {
    const point = { id: "pt1" };
    const ctx = { newFeature: vi.fn(() => point), addFeature: vi.fn() };

    MultiPointMode.onClick.call(ctx, { count: 3 }, { lngLat: { lng: 1, lat: 2 } });

    expect(ctx.newFeature).toHaveBeenCalledWith({
      type: "Feature",
      properties: { count: 3 },
      geometry: { type: "Point", coordinates: [1, 2] },
    });
    expect(ctx.addFeature).toHaveBeenCalledWith(point);
  });

  it("switches to simple_select on Escape", () => {
    const ctx = { changeMode: vi.fn() };
    MultiPointMode.onKeyUp.call(ctx, {}, { keyCode: 27 });
    expect(ctx.changeMode).toHaveBeenCalledWith("simple_select");
  });

  it("ignores any other key", () => {
    const ctx = { changeMode: vi.fn() };
    MultiPointMode.onKeyUp.call(ctx, {}, { keyCode: 13 });
    expect(ctx.changeMode).not.toHaveBeenCalled();
  });

  it("displays every feature it's given as-is", () => {
    const display = vi.fn();
    const geojson = { type: "Feature" };
    MultiPointMode.toDisplayFeatures({}, geojson, display);
    expect(display).toHaveBeenCalledWith(geojson);
  });
});
