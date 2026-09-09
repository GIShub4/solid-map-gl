import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { Terrain } from "./index";
import { renderWithMap } from "../../testUtils/renderWithMap";

afterEach(cleanup);

describe("Terrain", () => {
  it("auto-creates a raster-dem source with Mapbox defaults when isMapLibre is false", () => {
    const { map } = renderWithMap(() => <Terrain />, { isMapLibre: false });
    const call = map.addSource.mock.calls[0];
    expect(call[1]).toMatchObject({
      type: "raster-dem",
      url: "mapbox://mapbox.terrain-rgb",
      tileSize: 512,
      maxzoom: 14,
    });
  });

  // Regression test: `ctx.isMapLibre` used to never be
  // set, so this branch was dead and every Terrain always got Mapbox's DEM defaults, even
  // against MapLibre. Assert the two configurations genuinely differ.
  it("auto-creates a raster-dem source with MapLibre defaults when isMapLibre is true (3.1)", () => {
    const { map } = renderWithMap(() => <Terrain />, { isMapLibre: true });
    const call = map.addSource.mock.calls[0];
    expect(call[1]).toMatchObject({
      type: "raster-dem",
      url: "https://demotiles.maplibre.org/terrain-tiles/tiles.json",
      tileSize: 256,
    });
    expect(call[1].maxzoom).toBeUndefined();
  });

  it("sets terrain with the auto-created source id and default exaggeration", () => {
    const { map } = renderWithMap(() => <Terrain />);
    const sourceId = map.addSource.mock.calls[0][0];
    expect(map.setTerrain).toHaveBeenCalledWith({ exaggeration: 1, source: sourceId });
  });

  it("uses an explicit source prop instead of auto-creating one", () => {
    const { map } = renderWithMap(() => <Terrain source="my-dem" exaggeration={2} />);
    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.setTerrain).toHaveBeenCalledWith({ exaggeration: 2, source: "my-dem" });
  });

  it("calls setTerrain(null) on cleanup", () => {
    const { map, unmount } = renderWithMap(() => <Terrain />);
    unmount();
    expect(map.setTerrain).toHaveBeenLastCalledWith(null);
  });
});
