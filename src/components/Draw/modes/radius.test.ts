import { describe, it, expect, vi } from "vitest";
import createRadiusMode from "./radius";

describe("radius mode", () => {
  const makeCtx = (overrides = {}) => ({
    updateUIClasses: vi.fn(),
    changeMode: vi.fn(),
    getFeature: vi.fn(() => ({})),
    deleteFeature: vi.fn(),
    newFeature: vi.fn((f) => ({ ...f, id: "point1", toGeoJSON: () => f })),
    addFeature: vi.fn(),
    activateUIButton: vi.fn(),
    map: { fire: vi.fn(), doubleClickZoom: { enable: vi.fn() } },
    _ctx: { store: { getInitialConfigValue: vi.fn(() => false) } },
    ...overrides,
  });

  const lib = { modes: { draw_line_string: {} } };

  it("advances the vertex forward on the first click", () => {
    const mode = createRadiusMode(lib);
    const ctx = makeCtx();
    const line = { updateCoordinate: vi.fn(), addCoordinate: vi.fn(), id: "line1" };
    const state = { currentVertexPosition: 0, direction: "forward", line };

    const result = mode.clickAnywhere.call(ctx, state, { lngLat: { lng: 1, lat: 2 } });

    expect(ctx.updateUIClasses).toHaveBeenCalledWith({ mouse: "add" });
    expect(state.currentVertexPosition).toBe(1);
    expect(line.updateCoordinate).toHaveBeenCalledTimes(2);
    expect(result).toBeNull();
  });

  it("prepends the starting coordinate when drawing backward", () => {
    const mode = createRadiusMode(lib);
    const ctx = makeCtx();
    const line = { updateCoordinate: vi.fn(), addCoordinate: vi.fn(), id: "line1" };
    const state = { currentVertexPosition: 0, direction: "backward", line };

    mode.clickAnywhere.call(ctx, state, { lngLat: { lng: 1, lat: 2 } });

    expect(line.addCoordinate).toHaveBeenCalledWith(0, 1, 2);
  });

  it("finishes the line and switches to simple_select on the second vertex", () => {
    const mode = createRadiusMode(lib);
    const ctx = makeCtx();
    const line = { addCoordinate: vi.fn(), id: "line1" };
    const state = { currentVertexPosition: 1, line };

    mode.clickAnywhere.call(ctx, state, { lngLat: { lng: 3, lat: 4 } });

    expect(line.addCoordinate).toHaveBeenCalledWith(0, 3, 4);
    expect(ctx.changeMode).toHaveBeenCalledWith("simple_select", { featureIds: ["line1"] });
  });

  it("does nothing on stop if the line feature was already deleted", () => {
    const mode = createRadiusMode(lib);
    const ctx = makeCtx({ getFeature: vi.fn(() => undefined) });

    mode.onStop.call(ctx, { line: { id: "line1" } });

    expect(ctx.activateUIButton).toHaveBeenCalled();
    expect(ctx.deleteFeature).not.toHaveBeenCalled();
  });

  it("creates a center point with a radius property when the line is valid", () => {
    const mode = createRadiusMode(lib);
    const ctx = makeCtx();
    const line = {
      id: "line1",
      removeCoordinate: vi.fn(),
      isValid: vi.fn(() => true),
      toGeoJSON: vi.fn(() => ({
        geometry: {
          coordinates: [
            [0, 0],
            [0, 0.01],
          ],
        },
      })),
    };

    mode.onStop.call(ctx, { line });

    expect(line.removeCoordinate).toHaveBeenCalledWith("0");
    expect(ctx.deleteFeature).toHaveBeenCalledWith(["line1"], { silent: true });
    expect(ctx.newFeature).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: { radius: expect.any(String) },
        geometry: { type: "Point", coordinates: [0, 0] },
      }),
    );
    expect(ctx.addFeature).toHaveBeenCalled();
    expect(ctx.map.fire).toHaveBeenCalledWith("draw.create", { features: [expect.anything()] });
    expect(ctx.changeMode).toHaveBeenCalledWith("simple_select", { featureIds: ["point1"] });
  });

  it("discards the feature and returns to simple_select when the line isn't valid", () => {
    const mode = createRadiusMode(lib);
    const ctx = makeCtx();
    const line = { id: "line1", removeCoordinate: vi.fn(), isValid: vi.fn(() => false) };

    mode.onStop.call(ctx, { line });

    expect(ctx.deleteFeature).toHaveBeenCalledWith(["line1"], { silent: true });
    expect(ctx.changeMode).toHaveBeenCalledWith("simple_select", {}, { silent: true });
    expect(ctx.map.fire).not.toHaveBeenCalled();
  });

  it("hides everything but the raw geojson for inactive features", () => {
    const mode = createRadiusMode(lib);
    const display = vi.fn();
    const state = { line: { id: "line1" } };
    const geojson = { properties: { id: "other" }, geometry: { coordinates: [] } };

    mode.toDisplayFeatures(state, geojson, display);

    expect(geojson.properties.active).toBe("false");
    expect(display).toHaveBeenCalledWith(geojson);
  });

  it("renders nothing for the active line until it has two coordinates", () => {
    const mode = createRadiusMode(lib);
    const display = vi.fn();
    const state = { line: { id: "line1" } };
    const geojson = { properties: { id: "line1" }, geometry: { coordinates: [[0, 0]] } };

    const result = mode.toDisplayFeatures(state, geojson, display);

    expect(result).toBeNull();
    expect(display).not.toHaveBeenCalled();
  });

  it("renders the vertex, line, measurement and circle once the active line has two coordinates", () => {
    const mode = createRadiusMode(lib);
    const display = vi.fn();
    const state = { line: { id: "line1" }, direction: "forward" };
    const geojson = {
      properties: { id: "line1" },
      geometry: {
        coordinates: [
          [0, 0],
          [0, 0.01],
        ],
      },
    };

    mode.toDisplayFeatures(state, geojson, display);

    expect(display).toHaveBeenCalledTimes(4);
    const [vertexCall, lineCall, measureCall, circleCall] = display.mock.calls.map((c) => c[0]);
    expect(vertexCall.properties.meta).toBe("vertex");
    expect(lineCall).toBe(geojson);
    expect(measureCall.properties.type).toBe("measure");
    expect(circleCall.geometry.type).toBe("Polygon");
  });
});
