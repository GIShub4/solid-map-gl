import { render } from "@solidjs/testing-library";
import { MapProvider } from "../components/MapProvider";
import { createMockMap, createMockMapLib, type MockMap } from "./mockMap";

/**
 * Renders `ui` inside a `<MapProvider>` backed by a mock map, mirroring how every real
 * component is only ever mounted underneath `<MapGL>`. Reused across component test files
 * instead of hand-wiring `MapProvider` + a mock per test.
 */
export function renderWithMap(
  ui: () => any,
  opts: {
    isMapLibre?: boolean;
    map?: MockMap;
    constants?: Record<string, any>;
  } = {},
) {
  const map = opts.map || createMockMap({ isMapLibre: opts.isMapLibre });
  const mapLib = createMockMapLib({ isMapLibre: opts.isMapLibre });

  const result = render(() => (
    <MapProvider
      map={map}
      mapLib={mapLib}
      isMapLibre={!!opts.isMapLibre}
      constants={opts.constants}
    >
      {ui()}
    </MapProvider>
  ));

  return { ...result, map, mapLib };
}
