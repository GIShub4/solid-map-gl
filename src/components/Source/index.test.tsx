import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { Source } from "./index";
import { renderWithMap } from "../../testUtils/renderWithMap";
import { createMockMap, tick } from "../../testUtils/mockMap";

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

  // Regression test: Source must not cache the
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

  // Regression test: the old `isSourceLoaded` guard used
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

  it("defaults to an empty object when geojson data is not given", () => {
    const { map } = renderWithMap(() => (
      <Source id="geo" source={{ type: "geojson", data: undefined as any }} />
    ));
    const handle = map.getSource("geo");
    expect(handle.setData).toHaveBeenCalledWith({});
  });

  it("resolves an 'osm:org' shorthand raster source into a/b/c tile URLs", () => {
    const { map } = renderWithMap(() => (
      <Source id="raster" source={{ type: "raster", url: "osm:org" } as any} />
    ));
    expect(map.addSource).toHaveBeenCalledWith(
      "raster",
      expect.objectContaining({
        url: "",
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
        ],
        attribution: expect.any(String),
      }),
    );
  });

  it("substitutes {r} with '@2x' on a high-DPI screen for a raster shorthand", () => {
    const originalRatio = window.devicePixelRatio;
    // @ts-ignore
    window.devicePixelRatio = 2;
    const { map } = renderWithMap(() => (
      <Source id="raster3" source={{ type: "raster", url: "carto:voyager" } as any} />
    ));
    expect(map.addSource).toHaveBeenCalledWith(
      "raster3",
      expect.objectContaining({
        tiles: expect.arrayContaining([expect.stringContaining("@2x.png")]),
      }),
    );
    window.devicePixelRatio = originalRatio;
  });

  it("calls setUrl for a raster source given an explicit (non-shorthand) URL", async () => {
    const [url, setUrl] = createSignal("https://example.com/a/{z}/{x}/{y}.png");
    const { map } = renderWithMap(() => (
      <Source id="raster2" source={{ type: "raster", url: url() } as any} />
    ));
    const handle = map.getSource("raster2");
    expect(handle.setUrl).toHaveBeenCalledWith("https://example.com/a/{z}/{x}/{y}.png");

    setUrl("https://example.com/b/{z}/{x}/{y}.png");
    await tick();
    expect(handle.setUrl).toHaveBeenLastCalledWith("https://example.com/b/{z}/{x}/{y}.png");
  });

  it("calls setTiles for a vector source with no url given", () => {
    const { map } = renderWithMap(() => (
      <Source id="vec2" source={{ type: "vector", tiles: ["a.png"] } as any} />
    ));
    const handle = map.getSource("vec2");
    // `lookup()` always runs the {s} a/b/c tile expansion on whatever `tiles` it's given,
    // even for a plain (non-shorthand) vector source, so a single-entry input becomes 3.
    expect(handle.setTiles).toHaveBeenCalledWith(["a.png", "a.png", "a.png"]);
    expect(handle.setUrl).not.toHaveBeenCalled();
  });

  it("logs debug output when map.debug is enabled", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const map = createMockMap();
    map.debug = true;
    renderWithMap(() => (
      <Source id="geo" source={{ type: "geojson", data: {} as any }} />
    ), { map });

    expect(debugSpy).toHaveBeenCalledWith(
      "%c[MapGL]",
      "color: #ec4899",
      "Add Source:",
      "geo",
    );
    debugSpy.mockRestore();
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
