# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## What this is

`solid-map-gl` is a [SolidJS](https://www.solidjs.com/) component library that wraps
[Mapbox GL JS](https://github.com/mapbox/mapbox-gl-js) (and, interchangeably,
[MapLibre GL JS](https://maplibre.org/projects/maplibre-gl-js/)). It aims to stay as close as
possible to the underlying Mapbox GL JS API — components are thin, declarative wrappers around
imperative `mapboxgl.Map` calls, not a re-imagined abstraction.

Published to npm as `solid-map-gl`. User-facing docs live at
https://gis-hub.gitbook.io/solid-map-gl (source: `README.md`, `SUMMARY.md`, `docs/`, and each
component's own `README.md`). See `docs/COMPONENTS.md` in this repo for a single-file technical
reference to every component, intended for contributors/agents rather than end users.

## Tech stack

- SolidJS (fine-grained reactivity — `createSignal`, `createEffect`, `createStore`, `onCleanup`)
- TypeScript, `jsx: preserve` with `jsxImportSource: solid-js`
- Build: Rollup via `rollup-preset-solid` (`rollup.config.js`), entry `src/index.ts`
- Tests: Vitest + `@solidjs/testing-library`, jsdom environment (`vite.config.ts`, `src/vitest.ts`)
- Peer deps: `mapbox-gl` or `maplibre-gl` (either works, `@babylonjs/core` and `three` optional)
- Turf.js (`@turf/*`) used only inside `Draw`'s measurement modes

### Commands

```
pnpm test            # run vitest
pnpm coverage         # vitest run --coverage
pnpm build            # rollup -c -> dist/
pnpm watch            # rollup -c -w
```

There is no lint script; TypeScript declarations are emitted separately
(`tsconfig.json`, `emitDeclarationOnly`) and consumed by rollup-preset-solid.

## Architecture

### Map instance flows down via context, not props

`MapGL` (`src/components/MapGL/index.tsx`) creates the actual `mapboxgl.Map`/`maplibregl.Map`
instance in `onMount`, waits for the `load` event, then renders `<MapProvider map={map}>` around
`props.children`. Every other component reads the map off context:

```ts
const [ctx] = useMapContext() // ctx.map is the raw Map instance, extended with debug/id-list fields
```

`MapProvider` (`src/components/MapProvider/index.tsx`) is a `solid-js/store`-backed context —
there is a single shared `state.map`. Components mutate the map imperatively inside
`createEffect`s and clean up in `onCleanup`. Nothing here uses SolidJS's diffing for the map
itself; Solid's reactivity is only used to know *when* to call the imperative Mapbox API again.

### Component composition mirrors Mapbox's own object model

- `Source` (`components/Source`) calls `map.addSource`, exposes its id via `SourceContext`
  (`useSourceId()`) so a nested `<Layer>` doesn't need an explicit `sourceId` prop.
- `Layer` (`components/Layer`) reads `useSourceId()` if `sourceId`/`style.source` aren't given,
  converts a flat Mapbox-style-spec object into `{ paint, layout, ...base }` via
  `updateStyle`/`newKey` in `index.tsx` (backed by `src/styles.ts`'s `baseStyle`/`layoutStyles`
  lists), and diffs old vs. new style on every `createEffect` re-run (see `diff()`) so only
  changed paint/layout properties are re-applied — full layer recreation is avoided.
- `Terrain` (`components/Terrain`) will auto-create a `raster-dem` source if none is nested/given.
- `Layer3D` bridges to BabylonJS or ThreeJS via a Mapbox `CustomLayerInterface`, exposing the
  scene through `useScene()`.
- `Draw` wraps `@mapbox/mapbox-gl-draw` (or a compatible `lib`), with custom modes under
  `components/Draw/modes/` (point, multi_point, line_string, polygon, radius, rectangle,
  rectangle_assisted) and length/area labeling via `@turf/*` in `modes/measurements.ts`.

### Mapbox vs. MapLibre — the `window.MapLib` global

`MapGL` imports `mapbox-gl` dynamically unless `props.mapLib` is passed, and stores whichever
library actually ends up in use on `window.MapLib`. Every other component (`Control`, `Marker`,
`Popup`, `Layer3D`) reads classes off `window.MapLib` (e.g. `window.MapLib.Popup`,
`window.MapLib.NavigationControl`) instead of importing `mapbox-gl` directly, so the same
component code works against either library. Don't reintroduce direct `mapbox-gl` imports for
runtime classes in leaf components — only types should come from `mapbox-gl`'s type defs.

### Style/basemap shorthands

`src/mapStyles.ts` defines `vectorStyleList` (`mb:*`, `here:*`, `esri:*`) and `rasterStyleList`
(`osm:*`, `carto:*`, `stamen:*`, `tf:*`). `MapGL.getStyle()` and `Source`'s `lookup()` resolve a
colon-delimited shorthand string (e.g. `"mb:light"`, `"osm:org"`) by walking the nested object;
anything not matching the `prefix:key` shape passes through unchanged. `{apikey}` and `{r}`
(retina) placeholders get substituted from `props.apikey` / `import.meta.env.VITE_*_API_KEY` and
`window.devicePixelRatio`. New basemap shortcuts belong in `src/mapStyles.ts`; new style docs
belong in `docs/styles.md`.

### Events

`src/events.ts` centralizes event name lists (`mapEvents`, `layerEvents`, `drawEvents`) and their
TS prop types (`mapEventTypes`, `layerEventTypes`, `drawEventTypes`). Components loop over these
arrays and wire `props.on<Event>` to `map.on(event, ...)` (or `map.on(event, layerId, ...)` for
per-layer handlers). Adding a new passthrough event means adding it to the relevant array *and*
type in `events.ts`, not hand-wiring it in the component.

### Debug logging

Most components implement a local `debug(text, value)` helper gated on `ctx.map.debug` /
`ctx.map.debugEvents` (set from `MapGL`'s `debug`/`debugEvents` props), logging via
`console.debug("%c[MapGL]", "color: <component-color>", ...)`. Keep this pattern for new
components rather than adding a new logging mechanism.

## Conventions to follow

- Components are function components (`Component<Props>` / `VoidComponent<Props>`) using
  `createEffect`/`onCleanup`, not classes.
- Reactive updates go through `createEffect`, guarded by early-return when the relevant map API
  isn't ready yet (`if (!ctx.map) return`) — don't add `useEffect`-style dependency arrays, Solid
  tracks dependencies automatically from what's read inside the effect.
- Prefer `splitProps` to separate "recreate on change" props from "update in place" props (see
  `Marker`, `Popup`, `Control`).
- Always clean up what you created: remove sources/layers/controls/images/markers/popups in
  `onCleanup`, mirroring the `add*`/`remove*` Mapbox API pairs.
- JSDoc comments on prop fields are used for editor hover docs — keep them one line, describing
  the *field*, not implementation history.
- New components need: `src/components/<Name>/index.tsx`, a matching `README.md` (gitbook style,
  used by `SUMMARY.md`), an export from `src/index.ts`, and an entry in `docs/COMPONENTS.md`.

## Gotchas

- Vite users need `optimizeDeps: { include: ['mapbox-gl'] }` or they'll hit a "does not provide an
  export named 'default'" error — this is called out in `docs/start.md`.
- `mapbox-gl` is a required peer dependency even for MapLibre-only projects (install it as
  `mapbox-gl@npm:empty-npm-package@1.0.0` in that case) because of how CSS/types are pulled in.
- `Layer`'s style diffing assumes flat camelCase-ish keys get bucketed into `paint`/`layout` via
  `newKey()`/`layoutStyles` — when adding new Mapbox style properties, check
  `src/styles.ts::layoutStyles` needs updating or the property will incorrectly land in `paint`.
- `git status` currently shows `src/index.tsx` deleted / `src/index.ts` untracked and a few other
  modified files — check `git status` before assuming a clean tree.
