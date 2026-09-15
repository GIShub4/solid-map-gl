import { describe, it, expect, vi } from "vitest";
import createPointMode from "./point";

describe("point mode", () => {
  it("tags the base draw_point feature with measure/anchor properties", () => {
    const DrawPoint = {
      onSetup: vi.fn(() => ({ point: { properties: { id: "p1" } } })),
    };
    const mode = createPointMode({ modes: { draw_point: DrawPoint } });

    const state = mode.onSetup.call({});

    expect(DrawPoint.onSetup).toHaveBeenCalled();
    expect(state.point.properties).toEqual({
      id: "p1",
      type: "measure",
      anchor: "bottom",
    });
  });

  it("writes the formatted coordinate label and moves the point on mouse move", () => {
    const mode = createPointMode({ modes: { draw_point: {} } });
    const updateCoordinate = vi.fn();
    const state = { point: { properties: {}, updateCoordinate } };

    mode.onMouseMove(state, { lngLat: { lng: 2.3522, lat: 48.8566 } });

    expect(state.point.properties.value).toBe("2.3522° 48.8566°");
    expect(updateCoordinate).toHaveBeenCalledWith("", 2.3522, 48.8566);
  });

  it("marks the in-progress point active and every other feature inactive", () => {
    const mode = createPointMode({ modes: { draw_point: {} } });
    const display = vi.fn((g) => g);
    const state = { point: { id: "abc" } };

    mode.toDisplayFeatures(state, { properties: { id: "abc" } }, display);
    expect(display).toHaveBeenLastCalledWith({ properties: { id: "abc", active: "" } });

    mode.toDisplayFeatures(state, { properties: { id: "other" } }, display);
    expect(display).toHaveBeenLastCalledWith({ properties: { id: "other", active: "false" } });
  });
});
