/**
 * Public `solid-map-gl/testing` entry point — the same mock `mapboxgl.Map`/`maplibregl.Map` and
 * `<MapProvider>` render helper this library's own test suite uses (see `.claude/dev-notes.md`
 * #158: real map construction depends on a real WebGL context, which environments like Vitest/
 * jsdom don't have, so `<MapGL>` can't be mounted directly in a test). Requires `vitest` and
 * `@solidjs/testing-library` — both optional peer dependencies, only needed if you import from
 * this entry.
 */
export {
  createMockMap,
  createMockMapLib,
  createMockDrawLib,
  tick,
} from "./testUtils/mockMap";
export type { MockMap } from "./testUtils/mockMap";
export { renderWithMap } from "./testUtils/renderWithMap";
