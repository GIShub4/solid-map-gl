# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## What this is

`solid-map-gl` is a [SolidJS](https://www.solidjs.com/) component library that wraps
[Mapbox GL JS](https://github.com/mapbox/mapbox-gl-js) (and, interchangeably,
[MapLibre GL JS](https://maplibre.org/projects/maplibre-gl-js/)). It aims to stay as close as
possible to the underlying Mapbox GL JS API — components are thin, declarative wrappers around
imperative `mapboxgl.Map` calls, not a re-imagined abstraction.

Published to npm as `solid-map-gl`. User-facing docs live at
https://gis-hub.gitbook.io/solid-map-gl (source: `docs/introduction.md`, `SUMMARY.md`, `docs/`, and
each component's own `README.md`). See `docs/COMPONENTS.md` in this repo for a single-file
technical reference to every component, intended for contributors/agents rather than end users.
`docs/api/` is generated API-reference Markdown (`pnpm docs:api`, via `typedoc`/
`typedoc-plugin-markdown`, config in `typedoc.json`/`tsconfig.typedoc.json`) — regenerate it by
hand after changing exported components' JSDoc/prop types and commit the result; it isn't wired
into CI.

### Three separate READMEs, maintained by hand — not generated from one another

GitHub, npm, and GitBook each read a different file, deliberately, because GitBook's `{% hint %}`/
`{% tabs %}`/`{% content-ref %}`/`{% embed %}` blocks and YAML frontmatter aren't standard Markdown
— GitHub/npm would render them as literal text instead of GitBook's rich blocks:

- `.github/README.md` — shown on the GitHub repo page. GitHub prefers `.github/README.md` over a
  root `README.md` if both exist, so this is the one to edit for the GitHub-facing description,
  badges, Getting Started, Components table, and usage examples. Plain GFM; can use GitHub-native
  `> [!NOTE]`/`[!TIP]`/`[!WARNING]`/`[!CAUTION]` alert blocks.
- `README.md` (repo root) — shown on npmjs.com's package page (npm always packs root `README.md`
  regardless of the `files` allowlist). Plain GFM, no GitHub-specific alert syntax (npm's renderer
  shows it as a plain blockquote, degrades fine but isn't styled).
- `docs/introduction.md` — GitBook's Introduction page (referenced from `SUMMARY.md`), the only one
  of the three allowed to use GitBook's frontmatter/`{% %}` block syntax.

There's no build step tying these together — there was a generator script for this and it was
removed because these files are small and rarely change. When editing the shared parts (currently
the intro paragraph and the Roadmap checklist), update all three by hand and keep them worded/ordered
the same. `docs/start.md`/`docs/styles.md`/`docs/examples.md` also use GitBook-only syntax but are
out of scope for this — they're only linked from the GitBook-rendered `docs/introduction.md` page,
not shown standalone on GitHub's repo homepage or npm.

## Tech stack

- SolidJS (fine-grained reactivity — `createSignal`, `createEffect`, `createStore`, `onCleanup`)
- TypeScript, `jsx: preserve` with `jsxImportSource: solid-js`
- Build: esbuild via `tsup`/`tsup-preset-solid` (`tsup.config.ts`), entry `src/index.tsx`
- Tests: Vitest + `@solidjs/testing-library`, jsdom environment (`vite.config.ts`, `src/vitest.ts`).
  Component tests render against a hand-rolled mock map (`src/testUtils/mockMap.ts`'s
  `createMockMap`/`createMockMapLib`/`createMockDrawLib`, wired up via
  `src/testUtils/renderWithMap.tsx`'s `renderWithMap()`) instead of a real `mapbox-gl`/`maplibre-gl`
  instance — real map construction depends on a real WebGL context, which jsdom doesn't have. The
  mock map is built on a class instance rather than a plain object literal so `solid-js/store`
  treats it as an opaque leaf (matching a real `mapboxgl.Map`'s non-plain prototype chain) instead
  of recursively proxying it, which would break the several components that do
  `ctx.map.sourceIdList.push(...)`-style direct array mutation.
- Peer deps: `mapbox-gl` or `maplibre-gl` (either works, `@babylonjs/core` and `three` optional)
- Turf.js (`@turf/*`) used only inside `Draw`'s measurement modes

### Commands

```
pnpm test            # run vitest
pnpm coverage         # vitest run --coverage
pnpm build            # tsup -> dist/
pnpm watch            # tsup --watch
pnpm docs:api         # typedoc -> docs/api/
```

There is no lint script; TypeScript declarations are emitted as part of `pnpm build` (tsup's own
dts step, driven by `tsconfig.json`), not via a standalone `tsc` invocation.

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

### Mapbox vs. MapLibre — `ctx.mapLib` / `ctx.isMapLibre`

`MapGL` imports `mapbox-gl` dynamically unless `props.mapLib` is passed, computes `isMapLibre` by
checking `typeof mapLib.Map.prototype.setConfigProperty !== "function"` (Standard Style's
`setConfigProperty` is Mapbox-only, so its absence is a stable way to tell the libraries apart
regardless of how `mapLib` was obtained), and passes both `mapLib` and `isMapLibre` into
`MapProvider`'s per-instance context. Every other component (`Control`, `Marker`, `Popup`,
`Camera`, `Layer3D`) reads classes off `ctx.mapLib` (e.g. `ctx.mapLib.Popup`,
`ctx.mapLib.NavigationControl`) instead of importing `mapbox-gl` directly, so the same component
code works against either library — this replaced an old `window.MapLib` global that broke
multi-map pages mixing both libraries, since a single global can't hold two values at once.
`ctx.isMapLibre` gates the handful of genuinely divergent behaviors (`Atmosphere`'s `setFog` vs.
`setSky`, `Terrain`'s DEM defaults, `Draw`'s MapLibre class-name patch, `Layer`'s Mapbox-only
`slot`). Don't reintroduce direct `mapbox-gl` imports for runtime classes in leaf components —
only types should come from `mapbox-gl`'s own top-level type exports (not deep `mapbox-gl/src/...`
paths, which don't resolve against any currently-published `mapbox-gl` release).

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
  used by `SUMMARY.md`), an export from `src/index.tsx`, and an entry in `docs/COMPONENTS.md`.

## Gotchas

- Vite users need `optimizeDeps: { include: ['mapbox-gl'] }` or they'll hit a "does not provide an
  export named 'default'" error — this is called out in `docs/start.md`.
- `mapbox-gl` is a required peer dependency even for MapLibre-only projects (install it as
  `mapbox-gl@npm:empty-npm-package@1.0.0` in that case) because of how CSS/types are pulled in.
- `Layer`'s style diffing assumes flat camelCase-ish keys get bucketed into `paint`/`layout` via
  `newKey()`/`layoutStyles` — when adding new Mapbox style properties, check
  `src/styles.ts::layoutStyles` needs updating or the property will incorrectly land in `paint`.
- The library entry point is `src/index.tsx`, not `.ts` — `tsup-preset-solid` only generates the
  `"solid"` export condition (the raw-JSX passthrough SolidStart needs) for entries whose filename
  literally ends in `.tsx`/`.jsx`; it doesn't inspect whether the file's own content has JSX. The
  file itself has no JSX in it, only re-exports — don't rename it back to `.ts`, that silently
  drops the `"solid"` condition from a future `pnpm build`'s regenerated `package.json` exports.
- `tsup`'s own `getProductionDeps`/`pkg.type` package.json reads (used to auto-externalize
  dependencies and to pick the `.js` vs `.mjs` output extension) have been observed returning a
  stale/empty read at build time regardless of `package.json`'s actual contents — `tsup.config.ts`
  works around both by passing `external` and `outExtension` explicitly rather than relying on
  tsup's own package.json introspection. If a future `pnpm build` starts silently bundling
  `mapbox-gl`/`maplibre-gl`/`three`/`@babylonjs/core` into `dist/` again (check `dist/` file sizes —
  they should be tens of KB, not MB) or emits `dist/index.mjs` instead of `dist/index.js`, look here
  first.
