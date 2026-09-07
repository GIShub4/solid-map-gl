import { describe, it, expect, afterEach } from "vitest";
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
});
