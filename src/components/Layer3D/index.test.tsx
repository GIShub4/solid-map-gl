import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { Layer3D, useScene } from "./index";
import { renderWithMap } from "../../testUtils/renderWithMap";

afterEach(cleanup);

// Layer3D's onMount is async and dynamically imports the (real, sizable) "three" package —
// that's genuine module-loading I/O, not just a microtask, so wait on a real macrotask rather
// than chaining Promise.resolve() ticks.
const waitForMount = () => new Promise((r) => setTimeout(r, 50));

// Actually invoking the real onAdd/render (constructing a THREE.WebGLRenderer or BABYLON.Engine
// against a fake GL context) reliably throws in jsdom — there is no real WebGL context to back
// it. Per UPGRADE_PLAN.md Section 7.2, asserting real Babylon/Three render output is explicitly
// out of scope for these mocked tests; this file only asserts the custom-layer wiring Layer3D
// itself is responsible for.
describe("Layer3D", () => {
  it("adds a custom layer with the expected renderingMode and lifecycle methods", async () => {
    const { map } = renderWithMap(() => <Layer3D id="scene1" origin={[0, 0, 0]} />);
    await waitForMount();

    expect(map.addLayer).toHaveBeenCalled();
    const [layer, beforeId] = map.addLayer.mock.calls[0];
    expect(layer).toMatchObject({ id: "scene1", type: "custom", renderingMode: "3d" });
    expect(typeof layer.onAdd).toBe("function");
    expect(typeof layer.render).toBe("function");
    expect(beforeId).toBeUndefined();
  });

  it("passes beforeId through to addLayer", async () => {
    const { map } = renderWithMap(() => (
      <Layer3D id="scene1" origin={[0, 0, 0]} beforeId="anchor" />
    ));
    await waitForMount();
    expect(map.addLayer).toHaveBeenCalledWith(expect.anything(), "anchor");
  });

  it("removes the custom layer on cleanup", async () => {
    const { map, unmount } = renderWithMap(() => <Layer3D id="scene1" origin={[0, 0, 0]} />);
    await waitForMount();
    unmount();
    expect(map.removeLayer).toHaveBeenCalledWith("scene1");
  });

  it("computes a Babylon world matrix (instead of Three's) when babylon is set", async () => {
    const { map } = renderWithMap(() => (
      <Layer3D babylon id="scene1" origin={[1, 2, 3]} />
    ));
    await waitForMount();

    expect(map.addLayer).toHaveBeenCalled();
    const [layer] = map.addLayer.mock.calls[0];
    expect(layer).toMatchObject({ id: "scene1", type: "custom", renderingMode: "3d" });
  });

  it("useScene() returns undefined outside of a Layer3D", () => {
    expect(useScene()).toBeUndefined();
  });
});
