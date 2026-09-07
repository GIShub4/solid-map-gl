import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { Control } from "./index";
import { renderWithMap } from "../../testUtils/renderWithMap";
import { tick } from "../../testUtils/mockMap";

afterEach(cleanup);

describe("Control", () => {
  it("resolves the navigation class by default and adds it to the map", async () => {
    const { map, mapLib } = renderWithMap(() => <Control />);
    await tick();
    expect(map.addControl).toHaveBeenCalledWith(
      expect.any(mapLib.NavigationControl),
      undefined,
    );
  });

  it("resolves the class matching an explicit type", async () => {
    const { map, mapLib } = renderWithMap(() => <Control type="scale" />);
    await tick();
    expect(map.addControl).toHaveBeenCalledWith(
      expect.any(mapLib.ScaleControl),
      undefined,
    );
  });

  it("uses a custom control instance verbatim when provided", async () => {
    const custom = { onAdd: () => document.createElement("div"), onRemove: () => {} };
    const { map } = renderWithMap(() => <Control custom={custom} />);
    await tick();
    expect(map.addControl).toHaveBeenCalledWith(custom, undefined);
  });

  // Regression test for 3.6 (UPGRADE_PLAN.md Section 3.6): "traffic"/"language" were documented
  // as valid `type`s but never implemented — resolving them produced `new undefined(...)`. The
  // fix was on the docs side (README no longer lists them); assert the code side still holds:
  // the type system has no resolvable class for either, so `controlClasses.get(...)` is undefined
  // and using them without a `custom` instance throws instead of silently constructing garbage.
  it("has no resolvable class for the removed traffic/language types (3.6)", async () => {
    expect(() => {
      renderWithMap(() => <Control type={"traffic" as any} />);
    }).toThrow();
  });

  it("moves (remove+re-add) rather than recreates the control when position changes", async () => {
    const [position, setPosition] = createSignal<"top-left" | "top-right">("top-left");
    const { map } = renderWithMap(() => <Control position={position()} />);
    await tick();
    const instance = map.addControl.mock.calls[0][0];

    setPosition("top-right");
    await tick();

    expect(map.removeControl).toHaveBeenCalledWith(instance);
    expect(map.addControl).toHaveBeenLastCalledWith(instance, "top-right");
  });

  it("removes the control on cleanup", async () => {
    const { map, unmount } = renderWithMap(() => <Control />);
    await tick();
    const instance = map.addControl.mock.calls[0][0];
    unmount();
    expect(map.removeControl).toHaveBeenCalledWith(instance);
  });
});
