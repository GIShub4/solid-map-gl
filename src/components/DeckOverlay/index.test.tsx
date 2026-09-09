import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { DeckOverlay } from "./index";
import { renderWithMap } from "../../testUtils/renderWithMap";
import { tick } from "../../testUtils/mockMap";

afterEach(cleanup);

class MockOverlay {
  setProps = vi.fn();
  constructor(public initialProps: any) {}
}

describe("DeckOverlay", () => {
  it("constructs the overlay once and adds it as a control", async () => {
    const { map } = renderWithMap(() => (
      <DeckOverlay overlay={MockOverlay} props={{ layers: [] }} />
    ));
    await tick();
    const instance = map.addControl.mock.calls[0][0];
    expect(instance).toBeInstanceOf(MockOverlay);
    expect(instance.initialProps).toEqual({ layers: [] });
  });

  it("forwards reactive prop updates via setProps without recreating the overlay", async () => {
    const [layers, setLayers] = createSignal<any[]>([]);
    const { map } = renderWithMap(() => (
      <DeckOverlay overlay={MockOverlay} props={{ layers: layers() }} />
    ));
    await tick();
    const instance = map.addControl.mock.calls[0][0];

    setLayers([{ id: "a" }]);
    await tick();

    expect(instance.setProps).toHaveBeenCalledWith({ layers: [{ id: "a" }] });
    // useControlPosition re-adds (remove + re-add) rather than recreating — the overlay instance
    // itself is never reconstructed a second time.
    expect(map.addControl.mock.calls.every((c: any[]) => c[0] === instance)).toBe(true);
  });

  it("constructs the overlay and forwards setProps with an empty object when no props are given", async () => {
    const { map } = renderWithMap(() => <DeckOverlay overlay={MockOverlay} />);
    await tick();
    const instance = map.addControl.mock.calls[0][0];
    expect(instance.initialProps).toEqual({});
    expect(instance.setProps).toHaveBeenCalledWith({});
  });

  it("removes the overlay control on cleanup", async () => {
    const { map, unmount } = renderWithMap(() => (
      <DeckOverlay overlay={MockOverlay} props={{}} />
    ));
    await tick();
    const instance = map.addControl.mock.calls[0][0];
    unmount();
    expect(map.removeControl).toHaveBeenCalledWith(instance);
  });
});
