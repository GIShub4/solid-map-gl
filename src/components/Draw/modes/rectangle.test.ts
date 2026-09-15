import { describe, it, expect, vi } from "vitest";
import createRectangleMode from "./rectangle";

describe("rectangle mode", () => {
  const makeRectangleFeature = () => ({
    id: "rect1",
    updateCoordinate: vi.fn(),
    removeCoordinate: vi.fn(),
    isValid: vi.fn(() => true),
    toGeoJSON: vi.fn(() => ({ type: "Feature" })),
  });

  const makeLib = (rectangle = makeRectangleFeature()) => ({
    modes: {
      draw_line_string: {
        onSetup: vi.fn((opts) => ({ ...opts })),
        onStop: vi.fn(),
      },
    },
    rectangle,
  });

  it("adds an empty polygon feature to draw into on setup", () => {
    const lib = makeLib();
    const mode = createRectangleMode(lib);
    const ctx = { newFeature: vi.fn(() => lib.rectangle), addFeature: vi.fn() };

    const state = mode.onSetup.call(ctx, { extra: 1 });

    expect(ctx.newFeature).toHaveBeenCalledWith(
      expect.objectContaining({ geometry: { type: "Polygon", coordinates: [[]] } }),
    );
    expect(ctx.addFeature).toHaveBeenCalledWith(lib.rectangle);
    expect(state.rectangle).toBe(lib.rectangle);
    expect(state.extra).toBe(1);
  });

  it("treats a tap as a mouse move followed by a click", () => {
    const lib = makeLib();
    const mode = createRectangleMode(lib);
    const onMouseMove = vi.fn();
    const onClick = vi.fn();
    const ctx = { onMouseMove, onClick };
    const state = { startPoint: [0, 0] };
    const e = { lngLat: { lng: 1, lat: 1 } };

    mode.onTap.call(ctx, state, e);

    expect(onMouseMove).toHaveBeenCalledWith(state, e);
    expect(onClick).toHaveBeenCalledWith(state, e);
  });

  it("skips the mouse-move emulation on the first tap with no start point yet", () => {
    const lib = makeLib();
    const mode = createRectangleMode(lib);
    const onMouseMove = vi.fn();
    const ctx = { onMouseMove, onClick: vi.fn() };

    mode.onTap.call(ctx, {}, { lngLat: { lng: 1, lat: 1 } });

    expect(onMouseMove).not.toHaveBeenCalled();
  });

  it("records the starting corner on the first click", () => {
    const lib = makeLib();
    const mode = createRectangleMode(lib);
    const ctx = { updateUIClasses: vi.fn(), changeMode: vi.fn() };
    const state: any = {};

    mode.onClick.call(ctx, state, { lngLat: { lng: 5, lat: 6 } });

    expect(state.startPoint).toEqual([5, 6]);
    expect(ctx.changeMode).not.toHaveBeenCalled();
  });

  it("finishes the rectangle and switches to simple_select on the second click", () => {
    const lib = makeLib();
    const mode = createRectangleMode(lib);
    const ctx = { updateUIClasses: vi.fn(), changeMode: vi.fn() };
    const rectangle = { id: "rect1" };
    const state = { startPoint: [0, 0], rectangle };

    mode.onClick.call(ctx, state, { lngLat: { lng: 5, lat: 6 } });

    expect(ctx.updateUIClasses).toHaveBeenCalledWith({ mouse: "pointer" });
    expect(state.endPoint).toEqual([5, 6]);
    expect(ctx.changeMode).toHaveBeenCalledWith("simple_select", { featuresId: "rect1" });
  });

  it("draws all four corners of the bounding box on mouse move", () => {
    const lib = makeLib();
    const mode = createRectangleMode(lib);
    const rectangle = makeRectangleFeature();
    const state = { startPoint: [0, 0], rectangle };

    mode.onMouseMove(state, { lngLat: { lng: 10, lat: 20 } });

    expect(rectangle.updateCoordinate).toHaveBeenCalledTimes(5);
    expect(rectangle.updateCoordinate).toHaveBeenNthCalledWith(1, "0.0", 0, 0);
    expect(rectangle.updateCoordinate).toHaveBeenNthCalledWith(2, "0.1", 10, 0);
    expect(rectangle.updateCoordinate).toHaveBeenNthCalledWith(3, "0.2", 10, 20);
    expect(rectangle.updateCoordinate).toHaveBeenNthCalledWith(4, "0.3", 0, 20);
  });

  it("does nothing on mouse move before the first click", () => {
    const lib = makeLib();
    const mode = createRectangleMode(lib);
    const rectangle = makeRectangleFeature();
    mode.onMouseMove({ rectangle }, { lngLat: { lng: 10, lat: 20 } });
    expect(rectangle.updateCoordinate).not.toHaveBeenCalled();
  });

  it("switches to simple_select on Escape", () => {
    const lib = makeLib();
    const mode = createRectangleMode(lib);
    const ctx = { changeMode: vi.fn() };
    mode.onKeyUp.call(ctx, {}, { keyCode: 27 });
    expect(ctx.changeMode).toHaveBeenCalledWith("simple_select");
  });

  it("finalizes a valid rectangle on stop", () => {
    const rectangle = makeRectangleFeature();
    const lib = makeLib(rectangle);
    const mode = createRectangleMode(lib);
    const ctx = { map: { fire: vi.fn() }, getFeature: vi.fn(() => rectangle) };

    mode.onStop.call(ctx, { rectangle });

    expect(lib.modes.draw_line_string.onStop).toHaveBeenCalled();
    expect(rectangle.removeCoordinate).toHaveBeenCalledWith("0.4");
    expect(ctx.map.fire).toHaveBeenCalledWith("draw.create", { features: [{ type: "Feature" }] });
  });

  it("discards an invalid rectangle on stop", () => {
    const rectangle = makeRectangleFeature();
    rectangle.isValid = vi.fn(() => false);
    const lib = makeLib(rectangle);
    const mode = createRectangleMode(lib);
    const ctx = {
      map: { fire: vi.fn() },
      getFeature: vi.fn(() => rectangle),
      deleteFeature: vi.fn(),
      changeMode: vi.fn(),
    };

    mode.onStop.call(ctx, { rectangle });

    expect(ctx.deleteFeature).toHaveBeenCalledWith(["rect1"], { silent: true });
    expect(ctx.changeMode).toHaveBeenCalledWith("simple_select", {}, { silent: true });
    expect(ctx.map.fire).not.toHaveBeenCalled();
  });

  it("bails out on stop if the rectangle feature was already deleted", () => {
    const rectangle = makeRectangleFeature();
    const lib = makeLib(rectangle);
    const mode = createRectangleMode(lib);
    const ctx = { map: { fire: vi.fn() }, getFeature: vi.fn(() => undefined) };

    mode.onStop.call(ctx, { rectangle });

    expect(rectangle.removeCoordinate).not.toHaveBeenCalled();
  });

  it("hides everything for a feature other than the in-progress rectangle", () => {
    const lib = makeLib();
    const mode = createRectangleMode(lib);
    const display = vi.fn();
    const state = { rectangle: { id: "rect1" } };
    const geojson = { properties: { id: "other" } };

    mode.toDisplayFeatures.call({}, state, geojson, display);

    expect(geojson.properties.active).toBe("false");
    expect(display).toHaveBeenCalledWith(geojson);
  });

  it("shows nothing for the active rectangle until a start point exists", () => {
    const lib = makeLib();
    const mode = createRectangleMode(lib);
    const display = vi.fn();
    const state = { rectangle: { id: "rect1" } };
    const geojson = { properties: { id: "rect1" } };

    mode.toDisplayFeatures.call({}, state, geojson, display);

    expect(display).not.toHaveBeenCalled();
  });

  it("shows length and area labels for the active rectangle once drawing has started", () => {
    const lib = makeLib();
    const mode = createRectangleMode(lib);
    const display = vi.fn();
    const ctx = { drawConfig: { userProperties: { showLength: true, showArea: true } } };
    const state = { rectangle: { id: "rect1" }, startPoint: [0, 0] };
    const geojson = {
      properties: { id: "rect1" },
      geometry: {
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
        ],
      },
    };

    const result = mode.toDisplayFeatures.call(ctx, state, geojson, display);

    // base geojson + two side-length labels + one area label
    expect(display).toHaveBeenCalledTimes(4);
    expect(display).toHaveBeenCalledWith(geojson);
    expect(result).toBeNull();
  });

  it("removes the in-progress rectangle on trash", () => {
    const lib = makeLib();
    const mode = createRectangleMode(lib);
    const ctx = { deleteFeature: vi.fn(), changeMode: vi.fn() };

    mode.onTrash.call(ctx, { rectangle: { id: "rect1" } });

    expect(ctx.deleteFeature).toHaveBeenCalledWith(["rect1"], { silent: true });
    expect(ctx.changeMode).toHaveBeenCalledWith("simple_select");
  });
});
