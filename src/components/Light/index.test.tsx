import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { Light } from "./index";
import { renderWithMap } from "../../testUtils/renderWithMap";
import { tick } from "../../testUtils/mockMap";

afterEach(cleanup);

describe("Light", () => {
  it("calls setLight with the given style", () => {
    const { map } = renderWithMap(() => <Light style={{ intensity: 0.5 }} />);
    expect(map.setLight).toHaveBeenCalledWith({ intensity: 0.5 });
  });

  it("defaults to an empty object when no style is given", () => {
    const { map } = renderWithMap(() => <Light style={undefined as any} />);
    expect(map.setLight).toHaveBeenCalledWith({});
  });

  it("re-applies when the style prop changes", async () => {
    const [intensity, setIntensity] = createSignal(0.5);
    const { map } = renderWithMap(() => <Light style={{ intensity: intensity() }} />);
    setIntensity(0.9);
    await tick();
    expect(map.setLight).toHaveBeenLastCalledWith({ intensity: 0.9 });
  });

  it("calls setLight(null) on cleanup", () => {
    const { map, unmount } = renderWithMap(() => <Light style={{ intensity: 0.5 }} />);
    unmount();
    expect(map.setLight).toHaveBeenLastCalledWith(null);
  });
});
