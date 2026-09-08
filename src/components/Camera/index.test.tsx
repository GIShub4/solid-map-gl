import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { Camera } from "./index";
import { renderWithMap } from "../../testUtils/renderWithMap";
import { createMockMap, tick } from "../../testUtils/mockMap";

afterEach(cleanup);

describe("Camera", () => {
  it("rotates the globe (via easeTo) when rotateGlobe is set and zoom is below maxSpinZoom", async () => {
    const map = createMockMap();
    map.getZoom.mockReturnValue(1); // below default maxSpinZoom (5) so rotateGlobe proceeds
    renderWithMap(() => <Camera rotateGlobe />, { map });
    await tick();

    expect(map.easeTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: expect.anything() }),
      { rotate: true },
    );
  });

  it("does not rotate further while the user is actively interacting", async () => {
    const map = createMockMap();
    map.getZoom.mockReturnValue(1);
    renderWithMap(() => <Camera rotateGlobe />, { map });
    await tick();
    map.easeTo.mockClear();

    map.fire("mousedown", {}); // marks userInteraction(true)
    // dragend (unlike moveend/mouseup/touchend) doesn't itself reset userInteraction — it only
    // triggers onEnd, so this exercises rotateGlobe()'s own `if (userInteraction()) return` guard.
    map.fire("dragend", {});

    expect(map.easeTo).not.toHaveBeenCalled();
  });

  it("rotates the viewport (bearing/pitch) instead of the globe when rotateViewport is set", async () => {
    const map = createMockMap();
    renderWithMap(() => <Camera rotateViewport />, { map });
    await tick();

    map.fire("dragend", {});

    expect(map.easeTo).toHaveBeenCalledWith(
      expect.objectContaining({ bearing: expect.any(Number), pitch: 60 }),
      { rotate: true },
    );
  });

  it("stops the camera when rotateGlobe turns off", async () => {
    const map = createMockMap();
    const { unmount: _unused } = renderWithMap(() => <Camera rotateGlobe={false} />, { map });
    await tick();
    expect(map.stop).toHaveBeenCalled();
  });

  it("removes moveend/dragend listeners on cleanup", async () => {
    const map = createMockMap();
    const { unmount } = renderWithMap(() => <Camera />, { map });
    await tick();
    unmount();
    expect(map.off).toHaveBeenCalledWith("moveend", expect.any(Function));
    expect(map.off).toHaveBeenCalledWith("dragend", expect.any(Function));
  });

  it("resumes rotation once the user releases interaction (mouseup)", async () => {
    const map = createMockMap();
    map.getZoom.mockReturnValue(1);
    renderWithMap(() => <Camera rotateGlobe />, { map });
    await tick();
    map.easeTo.mockClear();

    map.fire("mousedown", {});
    map.fire("mouseup", {}); // exercises the moveend/mouseup/touchend reset-to-false handler
    map.fire("moveend", {});

    expect(map.easeTo).toHaveBeenCalled();
  });

  it("speeds up the globe spin once zoom passes slowSpinZoom", async () => {
    const map = createMockMap();
    map.getZoom.mockReturnValue(4); // between default slowSpinZoom (3) and maxSpinZoom (5)
    renderWithMap(() => <Camera rotateGlobe />, { map });
    await tick();

    expect(map.easeTo).toHaveBeenCalled();
  });

  it("rotateViewport stops instead of easing while the user is interacting", async () => {
    const map = createMockMap();
    renderWithMap(() => <Camera rotateViewport />, { map });
    await tick();
    map.easeTo.mockClear();
    map.stop.mockClear();

    map.fire("mousedown", {});
    map.fire("dragend", {});

    expect(map.stop).toHaveBeenCalled();
    expect(map.easeTo).not.toHaveBeenCalled();
  });

  it("resets north/pitch when rotateViewport turns off with resetWhenStopped", async () => {
    const map = createMockMap();
    const { unmount } = renderWithMap(
      () => <Camera rotateViewport={false} resetWhenStopped />,
      { map },
    );
    await tick();
    unmount();
    expect(map.resetNorthPitch).toHaveBeenCalled();
  });

  it("animates a translate along a line and updates the free camera", async () => {
    let called = false;
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        if (!called) {
          called = true;
          cb(0);
        }
        return 0;
      });
    const map = createMockMap();
    renderWithMap(
      () => (
        <Camera
          translate={{
            type: "line",
            start: [0, 0, 0],
            end: [1, 1, 1],
            target: [0, 0],
            duration: 1000,
            easing: "in",
          }}
        />
      ),
      { map },
    );
    await tick();

    expect(map.setFreeCameraOptions).toHaveBeenCalled();
    rafSpy.mockRestore();
  });

  it("animates a translate along a sphere (slerp) when type is not 'line'", async () => {
    let called = false;
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        if (!called) {
          called = true;
          cb(0);
        }
        return 0;
      });
    const map = createMockMap();
    renderWithMap(
      () => (
        <Camera
          translate={{
            type: "sphere",
            start: [1, 0, 0],
            end: [0, 1, 0],
            target: [0, 0],
            duration: 1000,
          }}
        />
      ),
      { map },
    );
    await tick();

    expect(map.setFreeCameraOptions).toHaveBeenCalled();
    rafSpy.mockRestore();
  });
});
