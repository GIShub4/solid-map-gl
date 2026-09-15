# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates are filled in once a version is
actually tagged and published — entries under **[Unreleased]** are already merged to `main` but
have not shipped in a release yet, so if you're installing from npm today none of this affects you.

For the reasoning behind these changes (why a given default changed, why an alternative was
rejected, what's still open), see `.claude/dev-notes.md`.

## [Unreleased]

## [2.2.1] - 2026-09-16

### Added

- **`<MapGL onError>`** — called if map initialization fails (e.g. `mapLib.supported()` reports the
  environment can't run Mapbox/MapLibre GL JS, such as any WebGL-less context, or the underlying
  `new mapLib.Map(...)` constructor itself throws). Always logged via `console.error` in addition,
  so nothing is silently lost if this isn't provided.
- **`solid-map-gl/testing`** — a new entry point re-exporting this library's own internal mock
  `mapboxgl.Map`/`maplibregl.Map` and `<MapProvider>` render helper (`createMockMap`,
  `createMockMapLib`, `createMockDrawLib`, `renderWithMap`, `tick`), the same test doubles this
  library's own test suite uses to render components without a real WebGL context. Requires
  `vitest` and `@solidjs/testing-library`, both now optional peer dependencies. See `#158` in
  `.claude/dev-notes.md`.

### Fixed

- **`MapGL`**: `onMount`'s async setup had no error handling, so a construction failure (e.g.
  `mapLib.supported()` returning `false`, reliably the case under Vitest/jsdom and any other
  WebGL-less environment) became an unhandled promise rejection instead of something a consumer
  could react to — and the viewport-sync effect had no `!map` guard, so the very next `viewport`
  prop update after such a failure threw `TypeError: Cannot read properties of undefined (reading
  'stop')` on top of that. Both are now caught; see `onError` above. (#158)

## [2.2.0] - 2026-09-14

### Added

- **`<MapGL onTilesLoaded>`** — fires after `idle` once every currently-required tile has actually
  finished loading *and* rendering, unlike `onIdle` itself, which can fire while raster tiles are
  still fetching, mid GPU-upload, or still cross-fading in via `raster-fade-duration`. New
  `tilesLoadedTimeout`/`tilesLoadedFadeMargin` props tune the poll timeout and the flat margin used
  to outlast a cross-fade still in flight (mapbox-gl-js exposes no public event for "the fade
  finished").
- **`<MapGL offscreen>` / `onCapturerReady`** — renders the map off-screen (fixed, far outside the
  viewport) instead of filling its container, for capturing map images (e.g. PDF export) without
  showing the map. `<Source>`/`<Layer>` children work unchanged. `onCapturerReady` hands back a
  capturer whose `captureWhenSettled()` waits for the map to fully settle and returns a canvas data
  URL, ready for any PDF/document library — this doesn't depend on or assume one.
- **`<Image sdf>`** — runs the rasterized `source`/`symbol` through a real signed-distance-field
  transform before `addImage`, so `icon-color`/`icon-halo-color`/`icon-halo-width`/`icon-halo-blur`
  recolor and outline it crisply from paint properties at any size. Also exported package-wide as
  `toSDF`/`SDFOptions`/`PixelData`.
- **`<Image symbol>`** — a discrete `icon-image` shape (built-in name, custom SVG markup, or a raw
  path `d` string), as an alternative to `pattern`'s tiling fills, resolved through the same
  rasterization/SDF path a hand-authored `source` SVG would use. New `symbolList`/`SymbolName`
  exports alongside the existing `patternList`/`PatternName`.
- **`<Layer pulse>`** — continuously animates one or more paint properties (numeric or `*-color`)
  via a shared `requestAnimationFrame` loop and `setPaintProperty`, for a "pulsing dot" marker
  effect. Every field defaults, so bare `pulse`/`pulse={{}}` already pulses a symbol layer's halo
  with Tailwind's `animate-ping` look; `waveform: 'in' | 'out' | 'in-out'` selects the easing
  shape. Color interpolation reuses `colors.ts`'s browser-engine normalization via a new
  `toRgbaComponents` export.

### Fixed

- **`Image`**: the SDF encoding path used on a *successfully*-decoded (non-error, non-SVG-fallback)
  `source` image was passing whatever `map.loadImage` returned straight into the SDF transform
  unconverted — for a plain raster URL, mapbox-gl-js's real implementation commonly hands back an
  `ImageBitmap`, which has no `.data` array, so this threw at runtime. It's also missing the empty
  margin the SDF transform needs around the art (or the field clips at the bitmap edge) — both are
  now handled the same way the SVG-rasterization fallback path already did.

## [2.1.0] - 2026-09-10

### Added

- **`<MapGL constants>`** — named values (colors, widths, or any paint/layout value) defined once
  and reused across every `<Layer>` by writing `"@name"` in place of a literal value (e.g.
  `fillColor: "@primary"`). Updating `constants` re-applies only the layers referencing a changed
  name — the JS-side equivalent of the `constants`/`@name` feature the Mapbox GL style spec itself
  dropped after v7, resolved here before the value ever reaches Mapbox's own style representation.
- **`<Layer>` paint colors accept a Tailwind CSS v4 palette name** (`fillColor: 'blue-600'`),
  resolved from the page's live `--color-blue-600` custom property (including a consuming app's own
  customized/extended theme colors), or a raw CSS Color 4 function (`oklch(...)`, `lab(...)`,
  `color(...)`, ...) that Mapbox's own color parser can't read.
- **`'bg-{name} dark:bg-{name}'` color syntax** (e.g. `fillColor: 'bg-blue-600 dark:bg-blue-400'`)
  for colors that automatically track the page's light/dark theme — resolved through the browser's
  real CSS cascade against the actual compiled Tailwind utility classes, so it respects whatever
  dark-mode strategy a consuming app's Tailwind config uses (a class or data-attribute on any
  ancestor, a media query, a custom variant) instead of `solid-map-gl` guessing one.

### Fixed

- **`Image`**: pixelRatio handling now uses `window.devicePixelRatio` (matching `Source`'s `@2x`
  convention) instead of a hardcoded `2`, and actually oversamples the pattern canvas to render at
  that resolution; the `style.load` re-add listener no longer leaks a new registration on every
  reactive effect run, so images reliably survive a full style rebuild (e.g. switching basemaps);
  the SVG-string rasterization fallback now percent-encodes SVG markup before building its `data:`
  URI (an unescaped `#` in a hex color previously truncated the URI at a fragment), surfaces decode
  failures via an `onerror` handler instead of hanging forever, and scales both canvas axes
  uniformly so non-square SVGs keep their aspect ratio.

### Changed

- `MapGL`'s dark-mode `MutationObserver` now also watches `<html>` (not just `<body>`) for a
  `dark` class, matching Tailwind's own documented convention, and separately exposes a plain
  `themeVersion` counter (bumped on every observed change, unconditionally) so `Layer`'s
  `'bg-x dark:bg-y'` color resolution re-checks correctly even for dark-mode strategies (e.g. a
  `data-theme` attribute) the class-based heuristic used for `darkStyle` switching wouldn't
  recognize.

## [2.0.1] - 2026-09-09

### Fixed

- **`require("solid-map-gl")` was completely broken in 2.0.0** — the published package's
  `exports` field had no `"."` entry and no fallback condition, only a `solid`/`import`-gated
  one, so any CommonJS consumer (`require()`, `require.resolve()`, Jest configs on `commonjs`
  transform, some Node-targeted SSR bundler configs resolving under a bare `node` condition)
  got `ERR_PACKAGE_PATH_NOT_EXPORTED`. Caused by `tsup-preset-solid`'s single-entry output never
  emitting a `default`/`require` condition unless `cjs: true` is set. `exports` is now wrapped
  under `"."` with an explicit `default` fallback pointing at the same ESM build (matching the
  pre-2.0 rollup-based build's shape), plus an explicit `"./package.json"` export. ESM consumers
  (`import`, Vite, SolidStart) are unaffected — this only restores the fallback path.

## [2.0.0] - 2026-09-09

This is a major version bump. The library went a long time without updates while Mapbox GL JS,
MapLibre GL JS, and SolidJS all moved forward — bringing it current required breaking some things
on purpose rather than silently.

### Breaking Changes

- **Default map container styling changed.** `<MapGL>`'s container div used to default to
  `position: absolute; inset: 0; z-index: -1` (full-bleed, behind sibling content) unless you
  supplied `class`/`classList`/`style`, in which case the *entire* default was dropped. It now
  defaults to a plain, in-flow `width: 100%; height: 100%`, and a supplied `class`/`classList`/
  `style` layers on top of that minimal default instead of replacing it outright.
  **Migrate:** if you relied on the map auto-filling a positioned ancestor as a full-bleed
  background layer, add that explicitly: `<MapGL style={{ position: "absolute", inset: 0,
  "z-index": -1 }} ... />`. If you already supplied your own `class`/`style`, check it doesn't
  conflict with the new additive `width: 100%; height: 100%` default.

- **`window.MapLib` global removed.** `MapGL` used to stash whichever library it loaded on
  `window.MapLib` (never documented, but reachable). The active library (and an `isMapLibre` flag)
  is now exposed through Solid context instead. **Migrate:** replace `window.MapLib.SomeClass`
  reads with `ctx.mapLib.SomeClass`, where `const [ctx] = useMapContext()` — `ctx.mapLib` and
  `ctx.isMapLibre` are new keys alongside the existing `ctx.map`.

- **Peer dependency ranges are now enforced.** `mapbox-gl` and `solid-js` used to be unbounded
  (`"*"`). Now: `mapbox-gl: ^3.0.0`, `maplibre-gl: ^4.0.0 || ^5.0.0 || ^6.0.0` (added as a
  first-class peer instead of only usable via `mapLib`), `solid-js: ^1.8.0 <2.0.0`. Both
  `mapbox-gl`/`maplibre-gl` are marked optional in `peerDependenciesMeta`, since a consumer only
  ever needs one. **Migrate:** if you're pinned to `mapbox-gl` v1.x/v2.x, upgrade alongside
  `solid-map-gl` or stay on the last pre-upgrade version. Peer-dependency mismatches are warnings,
  not install-blocking errors, under npm 7+/pnpm/yarn — a newer major than declared will still
  install, just with a warning.

- **`config` prop no longer throws on MapLibre — it silently no-ops instead.** Passing `config`
  while using MapLibre used to throw `TypeError: map.setConfigProperty is not a function` from
  inside a reactive effect. It's now feature-detected and ignored (with a `debug()` log if
  `debug`/`debugEvents` is enabled), since MapLibre has no equivalent to Mapbox's Standard Style
  config system. **Migrate:** nothing required.

- **`Draw`'s `showLength`/`showArea` props now actually work.** These props existed but did
  nothing — the custom draw modes that read them were imported but never wired into `Draw`'s
  `modes` map. They now produce real, live length/area labels while drawing lines, polygons, and
  rectangles. `Draw` also registers four extra opt-in modes with no built-in equivalent:
  `multi_point`, `radius`, `rectangle`, `rectangle_assisted` (activate via
  `draw.changeMode(...)`). **Migrate:** if you were already passing `showLength`/`showArea`
  (previously inert), your drawn UI will now show measurement labels — remove the props if you
  don't want that.

- **`Atmosphere`'s `style` prop shape now distinguishes Mapbox `Fog` from MapLibre `Sky`.**
  `style` is now typed as `FogSpecification | MapLibreSky`, and `Atmosphere` branches on
  `ctx.isMapLibre` to call `map.setFog(...)` (Mapbox) or `map.setSky(...)` (MapLibre) with the
  correct shape. **Migrate:** Mapbox-only users see no change. MapLibre users who were passing
  Mapbox-shaped `Fog` properties (previously inert) need to switch to MapLibre's `sky` property
  names (`sky-color`, `horizon-color`, `fog-color`, `atmosphere-blend`, ...).

- **`Control` `type="traffic"` / `type="language"` removed from the documented `type` union.**
  These were documented but never implemented — passing either value threw `new undefined(...)`
  at runtime. Docs now only list implemented `type`s (`navigation`, `scale`, `attribution`,
  `fullscreen`, `geolocate`, `logo`, `terrain`). **Migrate:** use the `custom` prop with a
  manually-constructed instance, e.g. `<Control custom={new MapboxTraffic()} />`.

### Fixed

- `Terrain`'s MapLibre-specific DEM defaults now actually take effect — the flag they branched on
  (`isMapLibre`) was never set, so every `Terrain` silently used Mapbox's DEM source regardless of
  which library was active.
- `Light` is no longer dropped on a base-style swap (e.g. toggling `mb:dark` → `mb:light`, or
  dark-mode auto-switching).
- `Source`'s cached `getSource()` handle no longer goes stale after a base-style swap — every
  reactive update now fetches a fresh handle instead of mutating a detached `Style`'s source
  object.
- `Source`'s reactive `data`/`url`/`tiles` updates are no longer silently dropped when the source
  happens to be mid-tiling at the instant the effect runs.
- Restoring app layers after a base-style swap no longer clobbers another layer sharing the same
  `beforeType`/`beforeId` anchor (an off-by-one in `insertLayers`).
- `Draw` on MapLibre: keyboard shortcuts (Delete/Backspace/1/2/3) and native-looking control
  styling now work — both were silently broken because `mapbox-gl-draw` reads Mapbox's CSS class
  names internally. Mouse-driven drawing itself was unaffected either way.

### Added

- `DeckOverlay` component for integrating deck.gl layers on top of the map. You supply the
  overlay class (`MapboxOverlay`/`MapLibreOverlay`); `solid-map-gl` never imports `@deck.gl/*`
  itself, not even as an optional peer.
- Expanded `config` prop support for the full Mapbox Standard/Standard Satellite schema (3D
  toggles, theme, ~20 color overrides).
- TypeDoc-generated API reference, committed under `docs/api/`.

### Changed (non-breaking)

- Deep `mapbox-gl/src/...` type imports replaced with `mapbox-gl`'s own public top-level types;
  `@types/mapbox-gl` dropped (it had become an empty stub). Only affects unsupported deep imports
  of solid-map-gl's own internals, not normal `import MapGL, { Viewport } from "solid-map-gl"`
  usage.
- `import.meta.env.VITE_MAPBOX_ACCESS_TOKEN` / `VITE_VECTOR_API_KEY` / `VITE_RASTER_API_KEY`
  auto-detection is now guarded so non-Vite bundlers no longer crash when no explicit
  `apikey`/`accessToken` is passed.
- Build output (`dist/`) structure changed: moved from `rollup-preset-solid` to
  `tsup-preset-solid`. `dist/` is now three flat, fully bundled files instead of the old
  per-file source tree. The public `solid-map-gl` entry point and its `exports` conditions are
  unaffected — only undocumented deep imports like `solid-map-gl/dist/esm/...` could break.
  `mapbox-gl.css`'s import is now left external for the consumer's own bundler to resolve.
- Live examples moved from ~30 separately hand-maintained external StackBlitz projects into
  `examples/` in this repo, linked via `stackblitz.com/fork/github/...` instead.
