import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { Source } from "./index";
import { renderWithMap } from "../../testUtils/renderWithMap";
import { tick } from "../../testUtils/mockMap";

afterEach(cleanup);

describe("Source", () => {
  it("calls addSource with the resolved spec and registers the id on sourceIdList", () => {
    const { map } = renderWithMap(() => (
      <Source
        id="geo"
        source={{ type: "geojson", data: { type: "FeatureCollection", features: [] } }}
      />
    ));
    expect(map.addSource).toHaveBeenCalledWith(
      "geo",
      expect.objectContaining({ type: "geojson" }),
    );
    expect(map.sourceIdList).toContain("geo");
  });

  it("calls setData when the reactive geojson data prop changes", async () => {
    const [data, setData] = createSignal({ type: "FeatureCollection", features: [] as any[] });
    const { map } = renderWithMap(() => (
      <Source id="geo" source={{ type: "geojson", data: data() }} />
    ));
    const handle = map.getSource("geo");
    expect(handle.setData).toHaveBeenCalledTimes(1);

    setData({ type: "FeatureCollection", features: [{ type: "Feature" }] as any[] });
    await tick();
    expect(handle.setData).toHaveBeenCalledTimes(2);
  });

  it("calls setUrl/setTiles when the reactive vector source prop changes", async () => {
    const [url, setUrl] = createSignal("mapbox://a");
    const { map } = renderWithMap(() => (
      <Source id="vec" source={{ type: "vector", url: url() } as any} />
    ));
    const handle = map.getSource("vec");
    expect(handle.setUrl).toHaveBeenCalledWith("mapbox://a");

    setUrl("mapbox://b");
    await tick();
    expect(handle.setUrl).toHaveBeenCalledWith("mapbox://b");
  });

  it("calls updateImage when the reactive image source prop changes", async () => {
    const [url, setUrl] = createSignal("a.png");
    const { map } = renderWithMap(() => (
      <Source
        id="img"
        source={{ type: "image", url: url(), coordinates: [] } as any}
      />
    ));
    const handle = map.getSource("img");
    expect(handle.updateImage).toHaveBeenCalledTimes(1);

    setUrl("b.png");
    await tick();
    expect(handle.updateImage).toHaveBeenCalledTimes(2);
  });

  // Regression test for 3.4 (UPGRADE_PLAN.md Section 3.4): Source must not cache the
  // `getSource()` handle across a base-style swap — every reactive update should fetch a fresh
  // handle so it never mutates a detached Style's source object.
  it("fetches a fresh getSource() handle on every reactive update instead of caching it (3.4)", async () => {
    const [data, setData] = createSignal({ type: "FeatureCollection", features: [] as any[] });
    const { map } = renderWithMap(() => (
      <Source id="geo" source={{ type: "geojson", data: data() }} />
    ));

    const firstHandle = map.getSource("geo");
    const callsBefore = (map.getSource as any).mock.calls.length;

    // Simulate a base-style swap: a new Style object means getSource() now returns a brand new
    // handle for the same id — the old `firstHandle` is detached and must not be reused.
    const freshHandle: any = { ...firstHandle, setData: vi.fn() };
    (map.getSource as any).mockReturnValueOnce(freshHandle);

    setData({ type: "FeatureCollection", features: [{ type: "Feature" }] as any[] });
    await tick();

    // getSource was called again (not cached) for this update ...
    expect((map.getSource as any).mock.calls.length).toBeGreaterThan(callsBefore);
    // ... and the *new* handle's setData is the one that got the update, not the stale one.
    expect(freshHandle.setData).toHaveBeenCalled();
  });

  // Regression test for 3.8 (UPGRADE_PLAN.md Section 3.8): the old `isSourceLoaded` guard used
  // to drop reactive updates if the source happened to be mid-tiling. It's gone now — updates
  // must go through unconditionally, even while `isSourceLoaded` reports false.
  it("still calls setData while isSourceLoaded() reports false (3.8)", async () => {
    const [data, setData] = createSignal({ type: "FeatureCollection", features: [] as any[] });
    const { map } = renderWithMap(() => (
      <Source id="geo" source={{ type: "geojson", data: data() }} />
    ));
    (map.isSourceLoaded as any).mockReturnValue(false);

    const handle = map.getSource("geo");
    setData({ type: "FeatureCollection", features: [{ type: "Feature" }] as any[] });
    await tick();

    expect(handle.setData).toHaveBeenCalledTimes(2);
  });

  it("removes dependent layers then the source on cleanup", () => {
    const { map, unmount } = renderWithMap(() => (
      <Source id="geo" source={{ type: "geojson", data: {} as any }} />
    ));
    map.getStyle().layers = [
      { id: "layer1", source: "geo" },
      { id: "other", source: "not-geo" },
    ];

    const order: string[] = [];
    map.removeLayer.mockImplementation((id: string) => order.push(`layer:${id}`));
    map.removeSource.mockImplementation((id: string) => order.push(`source:${id}`));

    unmount();

    expect(order).toEqual(["layer:layer1", "source:geo"]);
  });
});
