import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { Draw } from "./index";
import { renderWithMap } from "../../testUtils/renderWithMap";
import { createMockDrawLib } from "../../testUtils/mockMap";

afterEach(cleanup);

describe("Draw", () => {
  it("constructs the control with merged styles/modes and adds it to the map", () => {
    const lib = createMockDrawLib();
    const { map } = renderWithMap(() => <Draw lib={lib} />, {});
    expect(map.addControl).toHaveBeenCalledTimes(1);
    const [instance, position] = map.addControl.mock.calls[0];
    expect(instance).toBeInstanceOf(lib);
    expect(position).toBe("top-right");
    // draw_point/draw_line_string/draw_polygon are overridden so showLength/showArea work
    // through the control's own toolbar (Stage 1's fix for 3.2), plus the four modes with no
    // built-in equivalent.
    expect(Object.keys(instance.options.modes)).toEqual(
      expect.arrayContaining([
        "draw_point",
        "draw_line_string",
        "draw_polygon",
        "multi_point",
        "radius",
        "rectangle",
        "rectangle_assisted",
      ]),
    );
  });

  it("respects an explicit position prop", () => {
    const lib = createMockDrawLib();
    const { map } = renderWithMap(() => <Draw lib={lib} position="bottom-left" />);
    expect(map.addControl).toHaveBeenCalledWith(expect.anything(), "bottom-left");
  });

  it("passes showLength/showArea through as userProperties", () => {
    const lib = createMockDrawLib();
    const { map } = renderWithMap(() => <Draw lib={lib} showLength showArea={false} />);
    const [instance] = map.addControl.mock.calls[0];
    expect(instance.options.userProperties).toEqual({ showLength: true, showArea: false });
  });

  it("calls getInstance with the constructed draw control", () => {
    const lib = createMockDrawLib();
    let received: any;
    renderWithMap(() => <Draw lib={lib} getInstance={(d) => (received = d)} />);
    expect(received).toBeInstanceOf(lib);
  });

  it("wires draw.* events to the map and unwires them on cleanup", () => {
    const lib = createMockDrawLib();
    let created: any;
    const { map, unmount } = renderWithMap(() => (
      <Draw lib={lib} onCreate={(e) => (created = e)} />
    ));

    const handler = map.on.mock.calls.find((c: any[]) => c[0] === "draw.create")?.[1];
    expect(handler).toBeTruthy();
    handler({ features: [] });
    expect(created).toEqual({ features: [] });

    unmount();
    expect(map.off).toHaveBeenCalledWith("draw.create", handler);
  });

  // MapLibre stopped using Mapbox's CSS class names internally — mapbox-gl-draw reads them via
  // this static, so keyboard shortcuts/control styling silently break there unless patched
  // before instantiating.
  it("patches the draw lib's class-name constants to MapLibre's on the MapLibre path", () => {
    const lib = createMockDrawLib();
    renderWithMap(() => <Draw lib={lib} />, { isMapLibre: true });
    expect(lib.constants.classes.CANVAS).toBe("maplibregl-canvas");
    expect(lib.constants.classes.CONTROL_BASE).toBe("maplibregl-ctrl");
  });

  it("leaves the draw lib's class-name constants untouched on the Mapbox path", () => {
    const lib = createMockDrawLib();
    renderWithMap(() => <Draw lib={lib} />, { isMapLibre: false });
    expect(lib.constants.classes.CANVAS).toBe("mapboxgl-canvas");
  });

  it("removes the control on cleanup", () => {
    const lib = createMockDrawLib();
    const { map, unmount } = renderWithMap(() => <Draw lib={lib} />);
    const [instance] = map.addControl.mock.calls[0];
    unmount();
    expect(map.removeControl).toHaveBeenCalledWith(instance);
  });
});
