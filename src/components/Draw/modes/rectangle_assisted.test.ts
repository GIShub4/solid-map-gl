import { describe, it, expect, vi } from "vitest";
import RectangleAssistedMode from "./rectangle_assisted";

describe("rectangle_assisted mode", () => {
  it("adds an empty polygon feature and resets UI state on setup", () => {
    const rectangle = { id: "rect1" };
    const ctx = {
      newFeature: vi.fn(() => rectangle),
      addFeature: vi.fn(),
      clearSelectedFeatures: vi.fn(),
      updateUIClasses: vi.fn(),
      setActionableState: vi.fn(),
      map: { doubleClickZoom: { disable: vi.fn() } },
    };

    const state = RectangleAssistedMode.onSetup.call(ctx, {});

    expect(ctx.newFeature).toHaveBeenCalledWith(
      expect.objectContaining({ geometry: { type: "Polygon", coordinates: [[]] } }),
    );
    expect(ctx.addFeature).toHaveBeenCalledWith(rectangle);
    expect(ctx.clearSelectedFeatures).toHaveBeenCalled();
    expect(ctx.setActionableState).toHaveBeenCalledWith({ trash: true });
    expect(state).toEqual({ rectangle, currentVertexPosition: 0 });
  });

  it("round-trips lng/lat through Web Mercator meters", () => {
    const point: [number, number] = [2.3522, 48.8566];
    const meters = RectangleAssistedMode.deegrees2meters(point);
    const back = RectangleAssistedMode.meters2degress(meters);
    expect(back[0]).toBeCloseTo(point[0], 6);
    expect(back[1]).toBeCloseTo(point[1], 6);
  });

  it("delegates a tap to onClick", () => {
    const ctx = { onClick: vi.fn() };
    const state = {};
    const e = { lngLat: { lng: 1, lat: 1 } };
    RectangleAssistedMode.onTap.call(ctx, state, e);
    expect(ctx.onClick).toHaveBeenCalledWith(state, e);
  });

  it("places successive corners on click and advances the vertex position", () => {
    const rectangle = { updateCoordinate: vi.fn() };
    const state = { rectangle, currentVertexPosition: 0 };

    RectangleAssistedMode.onClick.call({}, state, { lngLat: { lng: 1, lat: 2 } });

    expect(rectangle.updateCoordinate).toHaveBeenNthCalledWith(1, "0.0", 1, 2);
    expect(rectangle.updateCoordinate).toHaveBeenNthCalledWith(2, "0.1", 1, 2);
    expect(state.currentVertexPosition).toBe(1);
  });

  it("closes the rectangle and switches to simple_select on the third click", () => {
    const rectangle = {
      updateCoordinate: vi.fn(),
      getCoordinate: vi.fn((path: string) =>
        path === "0.0" ? [0, 0] : [0.001, 0],
      ),
    };
    const ctx = {
      updateUIClasses: vi.fn(),
      changeMode: vi.fn(),
      calculatepXY3: vi.fn(() => [0.001, 0.001]),
    };
    const state = { rectangle, currentVertexPosition: 2 };

    RectangleAssistedMode.onClick.call(ctx, state, { lngLat: { lng: 0.001, lat: 0.001 } });

    expect(rectangle.updateCoordinate).toHaveBeenCalledWith("0.3", 0.001, 0.001);
    expect(ctx.updateUIClasses).toHaveBeenCalledWith({ mouse: "pointer" });
    expect(ctx.changeMode).toHaveBeenCalledWith("simple_select", { featuresId: undefined });
  });

  it("tracks the oriented angle and the assisted third vertex on mouse move", () => {
    const rectangle = { updateCoordinate: vi.fn() };
    const ctx = {
      calculateOrientedAnglePolygon: vi.fn(),
      calculatepXY3: vi.fn(() => [1, 1]),
    };
    const state = { rectangle, currentVertexPosition: 2 };

    RectangleAssistedMode.onMouseMove.call(ctx, state, { lngLat: { lng: 5, lat: 6 } });

    expect(rectangle.updateCoordinate).toHaveBeenCalledWith("0.2", 5, 6);
    expect(ctx.calculateOrientedAnglePolygon).toHaveBeenCalledWith(state);
    expect(ctx.calculatepXY3).toHaveBeenCalledWith(state, expect.anything(), true);
    expect(rectangle.updateCoordinate).toHaveBeenCalledWith("0.3", 1, 1);
  });

  it("skips the angle/assist math before the second vertex exists", () => {
    const rectangle = { updateCoordinate: vi.fn() };
    const ctx = {
      calculateOrientedAnglePolygon: vi.fn(),
      calculatepXY3: vi.fn(),
    };
    const state = { rectangle, currentVertexPosition: 0 };

    RectangleAssistedMode.onMouseMove.call(ctx, state, { lngLat: { lng: 5, lat: 6 } });

    expect(ctx.calculateOrientedAnglePolygon).not.toHaveBeenCalled();
    expect(ctx.calculatepXY3).not.toHaveBeenCalled();
  });

  it("computes the standard-to-south-facing oriented angle between the first two vertices", () => {
    const rectangle = {
      getCoordinate: vi.fn((path: string) => (path === "0.0" ? [0, 0] : [0.01, 0])),
    };
    const state: any = { rectangle };

    RectangleAssistedMode.calculateOrientedAnglePolygon.call(
      { deegrees2meters: RectangleAssistedMode.deegrees2meters },
      state,
    );

    // due-east baseline -> the perpendicular "south-facing" oriented angle
    expect(state.angle).toBeCloseTo(270, 0);
  });

  it("derives the fourth corner from the other three via the perpendicular vector", () => {
    const rectangle = {
      getCoordinate: vi.fn((path: string) => {
        if (path === "0.0") return [0, 0];
        if (path === "0.1") return [0.01, 0];
        return [0, 0];
      }),
      updateCoordinate: vi.fn(),
    };
    const ctx = {
      deegrees2meters: RectangleAssistedMode.deegrees2meters,
      meters2degress: RectangleAssistedMode.meters2degress,
    };
    const state = { rectangle };

    const pXY3 = RectangleAssistedMode.calculatepXY3.call(
      ctx,
      state,
      { lngLat: { lng: 0.01, lat: 0.01 } },
      false,
    );

    expect(rectangle.updateCoordinate).toHaveBeenCalledWith("0.2", expect.any(Number), expect.any(Number));
    expect(rectangle.updateCoordinate).toHaveBeenCalledWith("0.3", expect.any(Number), expect.any(Number));
    expect(pXY3).toHaveLength(2);
  });

  it("switches to simple_select on Escape", () => {
    const ctx = { changeMode: vi.fn() };
    RectangleAssistedMode.onKeyUp.call(ctx, {}, { keyCode: 27 });
    expect(ctx.changeMode).toHaveBeenCalledWith("simple_select");
  });

  it("finalizes a valid rectangle on stop", () => {
    const rectangle = {
      removeCoordinate: vi.fn(),
      isValid: vi.fn(() => true),
      toGeoJSON: vi.fn(() => ({ type: "Feature" })),
    };
    const ctx = {
      updateUIClasses: vi.fn(),
      activateUIButton: vi.fn(),
      getFeature: vi.fn(() => rectangle),
      map: { fire: vi.fn() },
    };

    RectangleAssistedMode.onStop.call(ctx, { rectangle });

    expect(rectangle.removeCoordinate).toHaveBeenCalledWith("0.4");
    expect(ctx.map.fire).toHaveBeenCalledWith("draw.create", { features: [{ type: "Feature" }] });
  });

  it("discards an invalid rectangle on stop", () => {
    const rectangle = { removeCoordinate: vi.fn(), isValid: vi.fn(() => false) };
    const ctx = {
      updateUIClasses: vi.fn(),
      activateUIButton: vi.fn(),
      getFeature: vi.fn(() => rectangle),
      map: { fire: vi.fn() },
      deleteFeature: vi.fn(),
      changeMode: vi.fn(),
    };

    RectangleAssistedMode.onStop.call(ctx, { rectangle });

    expect(ctx.deleteFeature).toHaveBeenCalledWith([undefined], { silent: true });
    expect(ctx.changeMode).toHaveBeenCalledWith("simple_select", {}, { silent: true });
  });

  it("displays a single vertex point while fewer than 3 coordinates exist", () => {
    const display = vi.fn();
    const state = { rectangle: { id: "rect1" }, angle: 12 };
    const geojson = {
      properties: { id: "rect1" },
      geometry: { coordinates: [[[1, 2]]] },
    };

    RectangleAssistedMode.toDisplayFeatures(state, geojson, display);

    expect(display).toHaveBeenCalledTimes(1);
    const [feature] = display.mock.calls[0];
    expect(feature.geometry.type).toBe("Point");
    expect(feature.geometry.coordinates).toEqual([1, 2]);
  });

  it("displays a line while the rectangle has 3-4 coordinates", () => {
    const display = vi.fn();
    const state = { rectangle: { id: "rect1" }, angle: 12 };
    const geojson = {
      properties: { id: "rect1" },
      geometry: {
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
          ],
        ],
      },
    };

    RectangleAssistedMode.toDisplayFeatures(state, geojson, display);

    expect(display).toHaveBeenCalledTimes(1);
    expect(display.mock.calls[0][0].geometry.type).toBe("LineString");
  });

  it("displays the full polygon once it has all 5 closing coordinates", () => {
    const display = vi.fn();
    const state = { rectangle: { id: "rect1" }, angle: 12 };
    const geojson = {
      properties: { id: "rect1" },
      geometry: {
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      },
    };

    RectangleAssistedMode.toDisplayFeatures(state, geojson, display);

    expect(display).toHaveBeenCalledWith(geojson);
  });

  it("marks any non-active feature accordingly and still displays it", () => {
    const display = vi.fn();
    const state = { rectangle: { id: "rect1" }, angle: 12 };
    const geojson = { properties: { id: "other" }, geometry: { coordinates: [] } };

    RectangleAssistedMode.toDisplayFeatures(state, geojson, display);

    expect(geojson.properties.active).toBe("false");
    expect(display).toHaveBeenCalledWith(geojson);
  });

  it("removes the in-progress rectangle on trash", () => {
    const ctx = { deleteFeature: vi.fn(), changeMode: vi.fn() };
    RectangleAssistedMode.onTrash.call(ctx, { rectangle: { id: "rect1" } });
    expect(ctx.deleteFeature).toHaveBeenCalledWith(["rect1"], { silent: true });
    expect(ctx.changeMode).toHaveBeenCalledWith("simple_select");
  });
});
