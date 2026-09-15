import { describe, it, expect, vi } from "vitest";
import createLineStringMode from "./line_string";

describe("line_string mode", () => {
  const makeLib = () => ({
    modes: {
      draw_line_string: {
        onSetup: vi.fn(() => ({ line: { coordinates: [] } })),
        onMouseMove: vi.fn(),
        toDisplayFeatures: vi.fn(),
      },
    },
  });

  it("adds a hidden measure point feature alongside the base draw state", () => {
    const measureFeature = { id: "measure1" };
    const ctx = { newFeature: vi.fn(() => measureFeature) };
    const lib = makeLib();
    const mode = createLineStringMode(lib);

    const state = mode.onSetup.call(ctx);

    expect(lib.modes.draw_line_string.onSetup).toHaveBeenCalled();
    expect(state.line).toEqual({ coordinates: [] });
    expect(state.measure).toBe(measureFeature);
    expect(ctx.newFeature).toHaveBeenCalledWith(
      expect.objectContaining({
        geometry: { type: "Point", coordinates: [] },
      }),
    );
  });

  it("updates the measure label once two or more coordinates exist", () => {
    const lib = makeLib();
    const mode = createLineStringMode(lib);
    const updateCoordinate = vi.fn();
    const state = {
      line: {
        coordinates: [
          [0, 0],
          [0, 1],
        ],
      },
      measure: { properties: {}, updateCoordinate },
    };

    mode.onMouseMove.call({}, state, { lngLat: { lng: 0, lat: 1 } });

    expect(lib.modes.draw_line_string.onMouseMove).toHaveBeenCalled();
    expect(state.measure.properties.value).toBeTruthy();
    expect(updateCoordinate).toHaveBeenCalledTimes(1);
  });

  it("leaves the measure label untouched with fewer than two coordinates", () => {
    const lib = makeLib();
    const mode = createLineStringMode(lib);
    const state = { line: { coordinates: [[0, 0]] }, measure: { properties: {} } };

    mode.onMouseMove.call({}, state, { lngLat: { lng: 0, lat: 0 } });

    expect(state.measure.properties.value).toBeUndefined();
  });

  it("only displays the measure feature when showLength is enabled", () => {
    const lib = makeLib();
    const mode = createLineStringMode(lib);
    const display = vi.fn();
    const geoFeature = { type: "Feature", geometry: { type: "Point", coordinates: [] } };
    const state = { measure: { toGeoJSON: vi.fn(() => geoFeature) } };

    const ctxOff = { drawConfig: { userProperties: { showLength: false } } };
    mode.toDisplayFeatures.call(ctxOff, state, {}, display);
    expect(display).not.toHaveBeenCalled();

    const ctxOn = { drawConfig: { userProperties: { showLength: true } } };
    mode.toDisplayFeatures.call(ctxOn, state, {}, display);
    expect(display).toHaveBeenCalledWith(geoFeature);
    expect(lib.modes.draw_line_string.toDisplayFeatures).toHaveBeenCalledTimes(2);
  });
});
