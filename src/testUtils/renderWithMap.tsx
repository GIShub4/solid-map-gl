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
  // Explicit return type, not inferred: `render()`'s real return type includes a `debug()` method
  // typed against `@testing-library/dom`'s re-exported `pretty-format` options, a package this
  // library doesn't itself depend on — bundling this entry's public .d.ts (`solid-map-gl/testing`)
  // needs a type it can print by reference (this expression) rather than one it has to infer and
  // expand structurally, which fails with TS2883 ("cannot be named without a reference to
  // 'PrettyFormatOptions'") since that package isn't reachable from a consumer's own install.
): ReturnType<typeof render> & { map: MockMap; mapLib: ReturnType<typeof createMockMapLib> } {
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
