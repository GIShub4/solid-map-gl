import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { MGL_Image } from "./index";
import { renderWithMap } from "../../testUtils/renderWithMap";
import { tick } from "../../testUtils/mockMap";

afterEach(cleanup);

describe("MGL_Image", () => {
  it("calls loadImage then addImage for a URL source", async () => {
    const { map } = renderWithMap(() => <MGL_Image id="pin" source="pin.png" />);
    await tick();
    await tick();
    expect(map.loadImage).toHaveBeenCalledWith("pin.png", expect.any(Function));
    expect(map.addImage).toHaveBeenCalledWith(
      "pin",
      expect.objectContaining({ width: 1, height: 1 }),
      undefined,
    );
  });

  it("adds a non-string image source (e.g. ImageData-like) directly without calling loadImage", async () => {
    const source = { width: 2, height: 2, data: new Uint8Array(16) };
    const { map } = renderWithMap(() => <MGL_Image id="raw" source={source as any} />);
    await tick();
    expect(map.loadImage).not.toHaveBeenCalled();
    expect(map.addImage).toHaveBeenCalledWith("raw", source, undefined);
  });

  it("generates a canvas-backed pattern via onAdd/render instead of calling loadImage", async () => {
    const { map } = renderWithMap(() => (
      <MGL_Image id="hatch" pattern={{ type: "diagonal_l", color: "#000", background: "#fff", lineWith: 1 }} />
    ));
    await tick();
    expect(map.loadImage).not.toHaveBeenCalled();
    const call = map.addImage.mock.calls.find((c: any[]) => c[0] === "hatch");
    expect(call).toBeTruthy();
    expect(typeof call[1].onAdd).toBe("function");
    expect(typeof call[1].render).toBe("function");
  });

  it("updateImage is used on a reactive re-run once the loaded size matches the previous load", async () => {
    const [seed, setSeed] = createSignal(0);
    const { map } = renderWithMap(() => (
      <MGL_Image id="pin" source="pin.png" options={{ seed: seed() } as any} />
    ));
    await tick();
    await tick();
    expect(map.updateImage).not.toHaveBeenCalled();

    map.hasImage.mockReturnValue(true);
    setSeed(1);
    await tick();
    await tick();

    expect(map.updateImage).toHaveBeenCalled();
  });

  it("removes the image on cleanup if present", async () => {
    const { map, unmount } = renderWithMap(() => <MGL_Image id="pin" source="pin.png" />);
    await tick();
    map.hasImage.mockReturnValue(true);
    unmount();
    expect(map.removeImage).toHaveBeenCalledWith("pin");
  });

  it("throws if neither source nor pattern is given", () => {
    expect(() => renderWithMap(() => <MGL_Image id="broken" />)).toThrow(
      /Image or Pattern is required/,
    );
  });
});
