# solid-map-gl Modernization Audit & Upgrade Plan

**Status:** planning document — no component/library source code has been changed as part of this
audit. Two exceptions, implemented directly since they're additive tooling/process changes rather
than changes to the library itself: the `.github/dependabot.yml`/`.github/workflows/*.yml`
automated-dependency-update setup (see Section 6), and `MIGRATION.md`, the user-facing breaking-
changes list this plan will produce (kept in sync with this document as decisions are finalized).
**Decisions already made with the maintainer (2026-09-07):**
- Keep supporting **both** Mapbox GL JS and MapLibre GL JS.
- Breaking changes to the public API are acceptable (long-unmaintained, no compatibility
  guarantee to preserve).
- Testing strategy: mocked unit tests (jsdom + a mocked map object), not real-browser tests, at
  least for the first pass.
- Work order: **correctness bugs → API modernization → tests → build tooling.**

**Further decisions made with the maintainer (2026-09-07, after a doc-consistency review):**
- Section 11's container CSS default change is confirmed as written — resolves Open Question 5
  (Section 9). Ship it in Stage 1 as planned.
- `window.MapLib` global removal is confirmed outright, no deprecation window — resolves Open
  Question 2 (Section 9). Its concrete replacement is decided below.
- `MapProvider`'s context **stays on `createStore`**, reversing Section 2.3's original
  `createSignal` recommendation — `ctx.map` property access (documented in `CLAUDE.md` and used by
  every component plus any external consumer of the public `useMapContext()` export) does not
  change shape. `mapLib` and `isMapLibre` are added as two new store keys instead of a separate
  mechanism: `ctx.mapLib` (the resolved Mapbox/MapLibre class, replacing `window.MapLib` directly —
  this is the "exact new API name" `MIGRATION.md` previously deferred) and `ctx.isMapLibre`
  (boolean, replacing the dead flag from 3.1). Once `mapLib`/`isMapLibre` join `map` in the same
  context value, the store earns its keep by Section 2.3's own stated criterion
  ("stores earn their keep with nested/keyed reactivity") — the single-value case that motivated
  the signal suggestion no longer applies. Net effect: this is now purely additive, not breaking.

This document is meant to be worked through stage by stage in future sessions (with Claude Code
or otherwise). Each stage is scoped to be independently shippable.

---

## 1. Executive summary

The library was designed around an assumption — "Mapbox GL JS and MapLibre GL JS are close
enough that one thin wrapper works for both via a `window.MapLib` global" — that was mostly true
around the v1/early-v2 era and is **no longer reliably true**. Mapbox has pulled ahead with
proprietary features (Standard Style + `setConfigProperty`) that have no MapLibre equivalent, and
MapLibre has independently grown incompatible features in the exact area you were unsure about
(fog/sky). Separately, a handful of concrete bugs exist in the current code independent of any
external API change — most notably around style-swapping (which lines up with the rendering
issues you remembered), and a large, completely dead feature in `Draw` (measurement labels).

Priority read, in one paragraph: fix the confirmed bugs first (Section 3) since they're
independent of any research finding and are pure wins; then close the Mapbox/MapLibre capability
gaps (Section 4) since those are silent-failure risks, not compile errors; then modernize
type imports and a few API usages (Section 5); then add the test suite (Section 7) so future
changes don't regress any of the above; then modernize build tooling (Section 8), which is lower
risk and can happen any time.

---

## 2. What changed in the ecosystem since this library was last actively developed

### 2.1 Mapbox GL JS

| Area | Then → Now | Detail |
| --- | --- | --- |
| Version | Last aligned around early v2.x/v3.0 | Latest is **v3.29.0**. v3.0 was the big line: WebGL2-only, Mapbox Standard as default style, 3D lights/terrain, pitch up to 85°, `slot`s. |
| Fog / Sky | `type: 'sky'` **layer** was the old way | The `sky` layer type is now **deprecated**; the root-level `fog` style property + `map.setFog()`/`getFog()` is the current, recommended API (stabilized ~v2.0–2.3, later gained `vertical-range`). **`Atmosphere`'s use of `setFog()` is already the correct, current Mapbox API** — this part does not need to change for Mapbox specifically (see Section 4 for the MapLibre side, which is where the real problem is). |
| Standard Style config | Didn't exist | `setConfigProperty(importId, key, value)` / `setConfig` / `getConfig` (v3.0+), default import id `"basemap"`, `lightPreset`, label-visibility toggles. `MapGL`'s `config` prop already targets this correctly for Mapbox — but see Section 4, it silently breaks on MapLibre. |
| Globe projection | Didn't exist | `setProjection()` for non-Mercator projections landed v2.6.0; **globe** specifically landed v2.9.0. Passed through today via `options.projection` — looks fine, but `Camera`'s `rotateGlobe` behavior should be re-verified against current globe defaults (fog/atmosphere auto-behavior around the globe has changed across versions). |
| Free camera | New-ish then, stable now | `getFreeCameraOptions()`/`setFreeCameraOptions()`/`MercatorCoordinate` (v2.0.0) — no breaking changes found. `Camera` and `Layer3D`'s usage should still be valid. |
| `CustomLayerInterface` | Stable shape | `onAdd`/`render`/`onRemove`/`prerender` unchanged; a `wrapTileId` flag was added (additive). Main risk is the **WebGL2-only** requirement (see 2.2/Section 4) affecting `Layer3D`. |
| `addImage`/`loadImage` | Callback-only | `loadImage()` now also supports a Promise form (no callback ⇒ returns a promise), added ~v2.0.0. `Image`'s `_loadImage()` still uses the legacy callback form — works, but is worth modernizing (Section 5). |
| Per-layer events | New-ish then | `map.on(event, layerId, handler)` (v2.6.0) — exactly what `Layer`/`MapGL` already use. Current, no change needed. |
| Licensing | Recent at the time | Unchanged in substance: v2+ requires a Mapbox account/token under Mapbox's proprietary TOS, even for self-hosted tiles. This is *why* the `mapLib` escape hatch and the `mapbox-gl@npm:empty-npm-package` placeholder trick in `docs/start.md` exist — keep documenting it prominently. |
| Types | Flow | v3.5.0 migrated Mapbox's internals from Flow to **TypeScript**, with first-class published types. This is a real risk area — see Section 5.1. |
| `@mapbox/mapbox-gl-draw` | — | Still maintained, latest release v1.5.1 (~2 years old relative to Mapbox's release cadence). No explicit incompatibility with mapbox-gl-js v3 reported, but given the gap, **verify empirically rather than assume** (Stage 1 task). |

### 2.2 MapLibre GL JS

| Area | Finding |
| --- | --- |
| Version | Latest is v5.22–5.24 (April 2026), v6 transition underway. Stayed BSD-3-Clause, forked from Mapbox's last-open-source commit (~v1.13/pre-v2.0). |
| Globe | Supported, independently implemented (not a port of Mapbox's) — same `{type:'globe'\|'mercator'}` shape, but its own bug history (pole-drag zoom, dragend camera jumps with terrain, mostly fixed in recent 5.x). Timing/behavior can still differ from Mapbox's globe. |
| Terrain | Supported with the same `{source, exaggeration}` shape. Default DEM source differs (MapLibre demo tiles: `demotiles.maplibre.org`, tileSize 256, no fixed maxzoom vs. Mapbox's `mapbox://mapbox.terrain-rgb`, tileSize 512, maxzoom 14) — `Terrain/index.tsx` already *tries* to branch on this correctly, but see the confirmed bug in Section 3.1: the branch never actually triggers. |
| **Fog / Sky — real divergence** | MapLibre has grown its **own, differently-shaped `setSky()` API** / style `sky` object (`sky-color`, `sky-horizon-blend`, `horizon-color`, `horizon-fog-blend`, `fog-color`, `fog-ground-blend`, `atmosphere-blend` — explicitly still marked experimental in MapLibre's style spec). This is **not** the same property set as Mapbox's `Fog`. This is almost certainly the exact thing you half-remembered changing. `Atmosphere` today only calls `ctx.map.setFog()` — correct for Mapbox, wrong/no-op/possibly-throwing on current MapLibre. |
| Standard Style / config | **No equivalent exists in MapLibre.** `MapGL`'s `config` prop is Mapbox-only. Today, calling `ctx.map.setConfigProperty(...)` against a MapLibre map throws `TypeError: ctx.map.setConfigProperty is not a function` inside a `createEffect` — a real, confirmed-by-reasoning runtime crash risk for any MapLibre user who passes a `config` prop (Section 3). |
| Free camera | Present on both, matching shape (`MercatorCoordinate` position + quaternion orientation, same `CameraOptions` fallback). Safe to keep shared. |
| `CustomLayerInterface` | Same interface shape, but MapLibre has **dropped WebGL1 support** (WebGL2-only in recent 5.x) and manages the stencil buffer differently for layer ordering, which can conflict with custom layers doing raw stencil ops. `Layer3D`'s Babylon/Three bridge should be checked against WebGL2-only assumptions on the MapLibre path. |
| `map.isMapLibre` | **Not a real property on either library.** See confirmed bug, Section 3.1. |
| `@mapbox/mapbox-gl-draw` + MapLibre | **Partially affected, not broken — corrected by Stage 0 empirical testing (see `STAGE0_FINDINGS.md`).** MapLibre stopped using Mapbox's CSS class names internally, which `mapbox-gl-draw` reads via `MapboxDraw.constants.classes`. Verified live against current MapLibre (v6.7.0): **mouse-driven drawing (click to place points/vertices, trash-button click) works fine unpatched** — that path goes through the map's abstracted event system, not raw class inspection. The *only* concretely broken behavior is **keyboard shortcuts** (Delete/Backspace/1/2/3), gated by a single hardcoded `classList.contains('mapboxgl-canvas')` check in `mapbox-gl-draw/src/events.js:132`; plus a **cosmetic-only** control-styling mismatch (the control wrapper `<div>` gets Mapbox's class names, so it renders without MapLibre's native control look, though Draw's own CSS still boxes it). No maintained MapLibre-specific fork exists; the documented community workaround (a one-line `Object.assign(MapboxDraw.constants.classes, {...})` before instantiating) verifiably fixes both issues. `Draw/index.tsx` does none of this today. |
| Overall | The two libraries have diverged meaningfully. Camera/terrain/projection APIs are close enough to keep sharing. Atmosphere/sky, Standard-Style config, and Draw integration have genuinely forked or broken. **A real capability-detection layer is now required**, not a shared code path with an aspirational `isMapLibre` flag. |

### 2.3 SolidJS

| Area | Finding |
| --- | --- |
| Version | Latest stable is **1.9.15**. Current `"solid-js": "*"` peer dep resolves to this fine. |
| Solid 2.0 | Not released — at `v2.0.0-beta.15` (June 2026), explicitly still in a documentation/migration-strategy phase, no stabilization date. **Not a near-term concern**, but worth knowing what would break if the project ever tracks it: `createEffect` splits into compute/apply phases; `onMount`→`onSettled`; `createStore` setters become draft-first (`setState(x => { x.map = m })`) instead of path-style (`setState('map', m)`) — the path-style old syntax survives only behind an opt-in `storePath()` helper; `createContext`'s return value *is* the provider and `useContext` **throws** instead of returning `undefined` when there's no provider; `Index` is removed for `<For keyed={false}>`; `use:` directives are removed for ref-directive factories. |
| Are current 1.x patterns still idiomatic? | Yes — `createSignal`, `createEffect`, `on(..., {defer:true})`, `onCleanup`/`onMount`, `splitProps`, `createUniqueId`, `untrack` are all unchanged and current. `MapProvider`'s `createStore({ map: null })` + `setState('map', props.map)` was flagged in an earlier pass as storing a single non-nested value in a store, where a plain `createSignal` would be more idiomatic — **reversed 2026-09-07** (see the decisions block at the top of this document): once `mapLib`/`isMapLibre` join `map` in the same context (Section 4.1), the store's nested/keyed-reactivity case actually applies, and switching to a signal would have broken `ctx.map`'s public property-access shape for no remaining benefit. Keep `createStore`, just add the two new keys. |
| `@solidjs/testing-library` | Actively maintained, works with current solid-js + Vitest. Standard stack: `vitest` + `jsdom` + `@solidjs/testing-library` + `@testing-library/user-event` + `@testing-library/jest-dom` (already 3 of these 4 are in `devDependencies`). Key API difference from React Testing Library: `render()` takes a function returning a component, not the component itself; there's no `rerender` (Solid doesn't re-render — it reacts). |
| Vitest + Solid | `vite-plugin-solid` is still the standard (already in use, `vite.config.ts`). As of `vite-plugin-solid@2.8.2+` it can auto-configure test-mode resolution; a classic remaining gotcha is solid-js loading through two different module graphs (Vite dev server vs. Node) causing "dispose is undefined" — dedupe if this ever appears. |
| Context pattern | No newer primitive supersedes `createContext`/`useContext` for sharing one external instance across a tree. Current pattern is still correct; just prefer a signal over a store for the single-value case (see above). |
| `exports`/`"solid"` condition | Still correct and required for 2026 tooling; no change needed to the concept, only to how it's generated (Section 8). |

---

## 3. Confirmed bugs (verified directly against current source — highest priority)

These aren't hypotheses from research — I read the actual code and traced the logic.

### 3.1 `Terrain`'s MapLibre branch is dead code — `isMapLibre` is never set

`src/components/Terrain/index.tsx:26-30` branches DEM source URL/tileSize/maxzoom on
`ctx.map.isMapLibre`. **Nothing in the codebase ever sets `map.isMapLibre`** — I grepped the
entire `src/` tree and the only references are the three reads in `Terrain`. `MapGL`'s `onMount`
(`src/components/MapGL/index.tsx`) sets `map.debug`, `map.debugEvents`, `map.sourceIdList`,
`map.layerIdList` on the map instance but never a library-identity flag. Net effect: **every
`Terrain` component always uses the Mapbox defaults** (`mapbox://mapbox.terrain-rgb`, tileSize
512, maxzoom 14), even when running against MapLibre with no Mapbox account — which will fail to
load DEM tiles for MapLibre-only users relying on the auto-created source.

**Fix:** `MapGL` already knows definitively which library it loaded (`props.mapLib` vs. the
dynamic `import("mapbox-gl")`). Set an explicit, real flag there — e.g. `map.isMapLibre = !mapLib.setConfigProperty` doesn't work either; better: check something stable like the presence of
a MapLibre-only static (`mapLib.getVersion?.()` string, or simply track "did I use `props.mapLib`
and does its `name`/`version` string contain `maplibre`") and propagate it through context/the
map object so *every* component can use one reliable check, not just `Terrain`.

### 3.2 `Draw`'s advertised measurement feature (`showLength`/`showArea`) is 100% dead code

`src/components/Draw/index.tsx` imports all seven custom draw modes
(`MultiPointMode`, `LineStringeMode`, `PointMode`, `PolygonMode`, `RadiusMode`, `RectangleMode`,
`RectangleAssistedMode`) but the lines that would register them into the `modes: {...}` object
passed to the draw library are **all commented out** (lines 39-45). The library's own
`README.md` and `Draw/README.md` document `showLength`/`showArea` as working props. I confirmed
by grep that `getLength`/`getArea` (in `modes/measurements.ts`) are only ever called from inside
`modes/polygon.ts`, `modes/rectangle.ts`, `modes/radius.ts`, `modes/line_string.ts` — i.e. from
code that **never runs**, because none of these custom modes are wired into the actual Draw
control's `modes` map. `showLength`/`showArea` are passed through to `userProperties` but nothing
reads them at runtime. There's also a second, entirely separate and equally unused set of exports
in `modes/index.ts` (`draw_point`, `draw_polygon`, `draw_line_string`, `draw_radius`,
`draw_rectangle`) — a leftover from an earlier attempt, adding confusion.

**This is ~1000 lines of dead code** (`modes/*.ts` + `drawingStyles.jsx`) implementing a feature
that has never shipped working. Decide explicitly: finish wiring the custom modes in (real,
scoped work — each mode needs testing against the current `@mapbox/mapbox-gl-draw` mode
lifecycle, which has evolving semantics), or drop the feature and the dead code and adjust
`showLength`/`showArea`/docs accordingly. Recommend deciding this in Stage 1 before writing any
tests for `Draw`, since testing dead code is wasted effort.

### 3.3 `Light` is dropped on every base-style swap

In `MapGL`'s style-swap `createEffect` (the block that calls `map.setStyle(style)` then, on
`styledata`, re-merges old sources/layers into the new style), the merge object explicitly
preserves `fog: oldStyle.fog` and `terrain: oldStyle.terrain` — but **not** `light`. Any active
`<Light>` component's setting is silently lost the moment the base map style changes (e.g. toggling
`mb:dark`→`mb:light`, or dark-mode auto-switching via `darkStyle`), and nothing re-applies it,
because `Light`'s own `createEffect(() => ctx.map.setLight(props.style || {}))` only re-runs when
`props.style` itself changes — not when the *base map style* changes underneath it.

**Fix:** add `light: oldStyle.light` to the merge object (mirroring `fog`/`terrain`), or — more
robustly — have `Atmosphere`/`Light`/`Terrain` each re-assert their state after every base-style
swap (e.g. by having `MapGl` emit a "style swapped" signal these components can react to), rather
than relying on `MapGL`'s merge object to enumerate every stateful style property correctly.

### 3.4 `Source`'s cached source handle almost certainly goes stale after a base-style swap

**This is very likely the exact rendering bug you remembered** ("when the style or source
changed, SolidJS does this on the fly, but then I had rendering issues because the style was not
correct").

`src/components/Source/index.tsx` does:

```ts
ctx.map.addSource(props.id, lookup(props.source.url))
...
const source = ctx.map.getSource(props.id)   // captured ONCE at creation time
...
createEffect(() => {
  ...
  source.setData(data || {})                 // uses the captured reference forever after
})
```

Mapbox/MapLibre's `map.setStyle()` tears down and rebuilds the internal `Style` object. Even
though `MapGL`'s restyle logic re-adds the old source's JSON into the new style (so the source
*data* survives), the **JS object reference** previously returned by `getSource()` is for the old,
now-detached `Style` instance. Calling `.setData()`/`.setUrl()`/`.setTiles()`/`.updateImage()` on
that stale reference after a restyle is a well-known Mapbox gotcha — behavior ranges from
silent no-ops to thrown errors, depending on version and source type. Since `Source` never
refreshes `source` after a restyle, **any reactive update to a `Source`'s data made after the
first base-style change is suspect.**

**Fix:** don't cache `source` across the component's lifetime. Either (a) call
`ctx.map.getSource(props.id)` fresh inside each `createEffect` right before using it, or (b)
listen for the map's style-swap completion (whatever signal `MapGL` ends up using per 3.3) and
refresh the cached reference at that point. Option (a) is simpler and removes an entire class of
staleness bugs for near-zero cost (`getSource` is cheap).

**Related, secondary optimization (worth a Stage 0 spike, not a fix on its own):** `react-map-gl`
leans on Mapbox/MapLibre's own built-in `map.setStyle(newStyle, { diff: true })` diffing instead of
tearing the style down fully (Section 13.5). Passing `{ diff: true }` on `MapGL`'s restyle call is
worth trying alongside the (a)/(b) fix above — it can reduce flicker/redundant tile refetch for
whatever portion of the *base* style is shared between old and new. It does **not** replace the
manual old-sources/old-layers merge logic already in `MapGL`: the diff only operates over what's
declared in the style JSON you pass in, so consumer-added `Source`/`Layer` content still needs to
be explicitly re-merged into the new style object the way `insertLayers`/`oldSources` already do
today — `diff: true` is a nice-to-have on top, not a substitute for 3.3/3.4's fixes.

### 3.5 `MapGL`'s `config` prop will throw on MapLibre, not just do nothing

`MapGL`'s config-effect calls `map?.setConfigProperty(id, key, value)` unconditionally whenever
`props.config` has keys. Per Section 2.2, **MapLibre has no `setConfigProperty` method at all.**
This isn't a "wrong visual result" bug like the fog/sky one — it's `TypeError: map.setConfigProperty is not a function`, thrown from inside a `createEffect`, for any MapLibre user who passes a
non-empty `config` prop (a very natural thing to try, since it's documented as a top-level `MapGL`
prop with no caveat that it's Mapbox-only).

**Fix:** guard with `typeof map.setConfigProperty === "function"` (or the same library-detection
mechanism from 3.1), and document `config` as Mapbox Standard Style-only in `Map/README.md` and
`docs/COMPONENTS.md`.

### 3.6 `Control`'s documented `type="traffic"`/`type="language"` don't exist in code

`Control/README.md` documents `type` as accepting `"traffic"` and `"language"` (with install
instructions for `@mapbox/mapbox-gl-traffic` / `@mapbox/mapbox-gl-language`), but
`Control/index.tsx`'s `ControlType` union and `controlClasses` map only contain `"navigation"`,
`"scale"`, `"attribution"`, `"fullscreen"`, `"geolocate"`, `"logo"`, `"terrain"` — there's no code
path that resolves `type: "traffic"` or `type: "language"` to anything. A user following the
README's own example would get `new (controlClasses.get("language"))(...)` → `new undefined(...)`
→ a crash. The only way to actually use those two controls today is via the undocumented `custom`
prop with a manually-constructed instance.

**Fix:** either implement `"traffic"`/`"language"` as real `ControlType` entries (resolving to the
optional-dependency classes, feature-detected/dynamically imported since they're optional peer
deps), or fix the README/docs to only document `custom` for these two. Cheap either way — do it
alongside 3.1/3.5 since it's the same "docs vs. code drift" category of bug.

### 3.7 `window.MapLib` is a single global — breaks multi-map pages with mixed libraries

Every component that needs a concrete class (`Control`, `Marker`, `Popup`, `Layer3D`) reads it off
`window.MapLib`, which `MapGL` overwrites on every mount (`window.MapLib = mapLib` in `onMount`).
If a page renders two `<MapGL>` instances — one using Mapbox, one using MapLibre (a realistic
scenario: e.g. a comparison view, or gradual migration) — whichever mounts *last* wins, and every
`Marker`/`Popup`/`Control`/`Layer3D` on the *other* map will silently construct the wrong
library's classes against the wrong map instance. This is architecture-level, not a one-line fix
— tracked as a Stage 2 item (Section 4.1), not Stage 1, since it requires threading `mapLib`
through context instead of a global.

### 3.8 `Source`'s `isSourceLoaded` guard silently drops reactive data updates

`src/components/Source/index.tsx` guards every reactive update effect — geojson `setData`
(line 71), image `updateImage` (line 80), vector `setUrl`/`setTiles` (line 89), raster
`setUrl`/`setTiles` (line 97) — behind `if (!ctx.map.isSourceLoaded(props.id)) return`. If the
source happens to be mid-tiling at the exact instant the effect runs, the new value is dropped
with **no retry, no queueing, and no re-arm** on the next `idle`/`sourcedata` event — the source
keeps rendering stale content until something unrelated happens to re-trigger the effect, which
may never happen again if the prop doesn't change further.

**Confirmed via a downstream consumer bug report** (a TB Mapper build pinned to
`solid-map-gl@1.13.0`): toggling a filter left facility/heatmap layers showing pre-filter data
indefinitely, while the app's own non-Mapbox Solid signal driving a companion UI banner updated
correctly in the same instant — proving the data itself was right and the loss was purely in this
guard. Mapbox/MapLibre document `GeoJSONSource#setData()` (and the vector/raster/image
equivalents) as safe to call at any time regardless of load state — they queue internally — so
this guard doesn't appear to protect anything real.

**Fix:** drop the `isSourceLoaded` guard entirely and call `setData`/`updateImage`/`setUrl`/
`setTiles` unconditionally. Same file as 3.4 but a distinct defect — 3.4's fix (refreshing the
cached `source` reference after a restyle) does not address this one, since the drop happens
before the reference is ever used.

### 3.9 `insertLayers`'s off-by-one replaces the matched layer instead of inserting before it

`MapGL`'s style-swap effect (`src/components/MapGL/index.tsx`, `insertLayers`, lines 340-353)
re-inserts the app's own layers into the new style at the position implied by
`beforeId`/`beforeType`:

```js
list =
  index === -1
    ? [...list, layer]
    : [...list.slice(0, index), layer, ...list.slice(index + 1)];
```

When a match is found, this drops `list[index]` — replacing the matched layer with the new one
instead of inserting the new one *before* it (a true insert-before would be `slice(0, index)` +
`layer` + `slice(index)`, no `+ 1`). Two consequences follow: (a) if more than one consumer layer
anchors to the same `beforeType`, only the first restores safely — each subsequent call runs
`findIndex` against an already-mutated `list` and can clobber a layer that was just re-inserted a
moment earlier, or an unrelated basemap layer of the matched type; (b) whatever gets clobbered is
gone for good — it's no longer present as an `oldLayer` on the next style reload, so it never
comes back on its own.

**Confirmed via the same downstream bug report:** three custom layers all anchored on
`beforeType="line"` — toggling the basemap style permanently dropped one of them after the first
toggle, confirmed via `map.getStyle()` showing it genuinely absent from the layer list, not just
reordered.

**Fix:** drop the `+ 1` — `[...list.slice(0, index), layer, ...list.slice(index)]` — matching
what `beforeId`/`beforeType` mean everywhere else in this library, and matching mapbox-gl's own
`addLayer(layer, beforeId)`, which inserts-before without removing anything. Bundle alongside 3.3
(`light` dropped on style swap) since both live in the same style-swap-merge code path.

---

## 4. Mapbox vs. MapLibre: what a real capability layer needs to cover

Given the "keep both" decision, the fix isn't per-bug patches — it's introducing one small,
explicit capability/detection layer that every component can consult, replacing the current mix
of "assume they're the same" (3.4, 3.5) and "assume a flag exists that doesn't" (3.1).

### 4.1 Proposed shape (for discussion in Stage 2, not to be built yet)

**Revised after Section 13's research — read that section for the full reasoning.** The original
version of this bullet argued for scattered per-component checks over a central adapter object;
having since surveyed how other wrapper libraries actually solve this, the better near-term answer
is a small, explicit two-object adapter (not scattered checks, and not a full per-library package
split either — see Section 13 for why both extremes are worse fits here):

- `MapGL` determines, at the point it resolves `mapLib` (either `props.mapLib` or the dynamically
  imported `mapbox-gl`), a single source of truth: `const isMapLibre = /* real check */`. Store it
  on the map instance (`map.isMapLibre = isMapLibre`, fixing 3.1 for real this time) **and** set it
  and `mapLib` as new keys (`ctx.isMapLibre`, `ctx.mapLib`) on `MapProvider`'s existing
  `createStore` — see the decisions block at the top of this document — instead of
  `window.MapLib`, fixing 3.7. `window.MapLib` is removed outright, no deprecation window
  (confirmed 2026-09-07, resolves Open Question 2/Section 9).
- Consolidate the handful of genuinely divergent behaviors (fog/sky, terrain DEM defaults,
  Standard-style config/slot support, Draw's MapLibre class-name patch, `DeckOverlay`'s
  class-choice guidance) into **one small adapter object per library** (e.g. `mapboxAdapter` /
  `maplibreAdapter`, each implementing the same tiny interface), resolved once by `MapGL` and put
  in context alongside `isMapLibre`, rather than five separate ad hoc `if (isMapLibre)` checks
  spread across `Atmosphere`/`Terrain`/`Draw`/`Control`/`DeckOverlay`. This keeps the "what differs
  between the two libraries" knowledge in one findable, independently-testable place — e.g.
  `Atmosphere` calls `ctx.adapter.setAtmosphere(map, style)`, which internally branches between
  `map.setFog(mapboxShapedStyle)` and `map.setSky(maplibreShapedStyle)` with two separate,
  explicitly-typed prop shapes (don't try to unify the two Fog/Sky spec shapes into one prop —
  they're genuinely different properties, per Section 2.2).
- `MapGL`'s `config` prop and `Control`'s `"terrain"`/Mapbox-only control types should
  feature-detect (`typeof map.setConfigProperty === "function"`) and no-op with a `debug()` log
  rather than throwing, for any Mapbox-only feature invoked against MapLibre.
- `Draw` needs an explicit MapLibre compatibility shim: when `ctx.mapLib.isMapLibre` and the
  library-in-use is `@mapbox/mapbox-gl-draw`, patch `lib.constants.classes` to MapLibre's class
  names before instantiating (per the documented community workaround in Section 2.2), or
  document that MapLibre users must supply a pre-patched `lib`.

### 4.2 Items needing empirical verification (can't be settled by research alone)

- ~~Does `TerrainControl` exist on MapLibre's exported class list?~~ — **RESOLVED by Stage 0
  (see `STAGE0_FINDINGS.md`):** yes, `TerrainControl` is a real exported class on
  `maplibre-gl@6.7.0`.
  - ~~Does MapLibre support `setLight`/style `light` at all, and with the same property shape as
  Mapbox?~~ — **RESOLVED:** yes, `setLight`/`getLight`/`LightSpecification` all exist on current
  MapLibre.
- ~~Whether `@mapbox/mapbox-gl-draw` v1.5.1 works unmodified against `mapbox-gl-js` v3.29~~ —
  **RESOLVED:** works with zero changes against current mapbox-gl (v3.30.0), verified live
  (click-to-place a point succeeded, no console errors).
- Whether MapLibre's stricter WebGL2-only stencil/context handling actually breaks `Layer3D`'s
  Babylon/Three render path in practice, or is just a theoretical risk. **Not yet verified** —
  Stage 0 covered the Draw/TerrainControl/setLight/types/diff spikes but not this one; still open
  for an early Stage 1/2 spike.

See `STAGE0_FINDINGS.md` for full methodology and detail, including a significant correction to
this section's Draw/MapLibre assessment (immediately below) and to Section 5.1's type-import risk
(now confirmed as an active, not hypothetical, build break).

---

## 5. Component-by-component status

Legend: 🟢 looks current, no action needed · 🟡 needs a scoped update · 🔴 confirmed broken/dead ·
❔ needs empirical verification (Section 4.2)

| Component | Status | Notes |
| --- | --- | --- |
| `MapGL` | 🔴🟡 | 3.5 (config throws on MapLibre), 3.3/3.9 (style-swap merge incomplete + `insertLayers` off-by-one clobbers same-`beforeType` layers), deep `mapbox-gl/src/*` type imports need revalidation against the v3.5 TS rewrite (Section 5.1). `import.meta.env.VITE_*` access is Vite-only — see Section 5.2. `config` prop's typed property list is missing most of the current Standard/Standard Satellite schema (Section 10). Default container CSS (`position:absolute; inset:0; z-index:-1`, all-or-nothing override) is a confirmed anti-pattern (Section 11). |
| `MapProvider` | 🟡 | Structurally fine as-is; extend the existing `createStore` with two new keys, `mapLib`/`isMapLibre` (Section 4.1) — `createSignal` was considered and rejected 2026-09-07 (Section 2.3) to avoid breaking `ctx.map`'s public property-access shape. |
| `Source` | 🔴 | 3.4 — stale cached source reference after restyle. 3.8 — `isSourceLoaded` guard silently drops reactive `setData`/`setUrl`/`setTiles`/`updateImage` calls, a distinct defect in the same file. Otherwise source-spec handling (geojson/vector/raster/image) is unchanged and current. |
| `Layer` | 🟡 | Style diff logic is sound and not Mapbox-v3-broken, but `src/styles.ts`'s `layoutStyles` list should be refreshed against the current style spec (v3 added layer types, e.g. `model`, and possibly new layout props not in the current list — anything missing gets misbucketed into `paint`). Already has a `slot` prop, which is good — needs documentation clarifying it's the *only* way to position against Mapbox Standard's own built-in layers (Section 10), distinct from `beforeId`/`beforeType` which remain valid for ordering the wrapper's own layers. |
| `DeckOverlay` *(proposed, doesn't exist yet)* | 🆕 | New component to support deck.gl interop (Section 12) — thin `Control`-lifecycle wrapper accepting an already-constructed `MapboxOverlay`/`MapLibreOverlay` class as a prop, no new dependency needed. |
| `Layer3D` | 🟡 | Functionally plausible but the file is ~60% commented-out dead experimental code (lines ~170-380) for an incomplete Babylon camera-sync attempt — should be finished or deleted before further investment. WebGL2-only assumption on MapLibre needs verification (4.2). Uses `window.MapLib.MercatorCoordinate` (4.1 fix applies). |
| `Control` | 🔴 | 3.6 — `"traffic"`/`"language"` documented but not implemented. `TerrainControl` on MapLibre needs verification (4.2). |
| `Image` | 🟡 | Works, but uses the legacy callback form of `loadImage` (Section 2.1) — modernize to the Promise form when touched. No Mapbox/MapLibre divergence found here. |
| `Marker` | 🟢❔ | No breaking API changes found. Verify `MarkerOptions`/drag event parity holds on current MapLibre (no negative signal found, just not exhaustively checked). |
| `Popup` | 🟢❔ | Same as `Marker`; specifically verify `trackPointer()` exists and behaves the same on current MapLibre. |
| `Terrain` | 🔴 | 3.1 — `isMapLibre` never set, MapLibre branch is dead. Everything else (raster-dem shape, `setTerrain` API) is current on both libraries. |
| `Atmosphere` | 🔴 | Correct for Mapbox (fog is the current, non-deprecated API) but has **no MapLibre-specific path** for MapLibre's diverged `setSky()`/sky-property-shape (Section 2.2/4.1). This is the "did they change how sky/atmosphere works" concern — yes, on MapLibre's side, they did. Also: `Fog` type could be widened to include newer Mapbox-only fields (`vertical-range`, `star-intensity`). |
| `Light` | 🔴 | 3.3 — dropped on base-style swap. MapLibre parity unverified (4.2). |
| `Camera` | 🟢❔ | Free camera API confirmed stable/shared across both libraries. `rotateGlobe` defaults should be spot-checked against current globe fog/atmosphere behavior, low priority. Minor tech debt: user-interaction tracking logic is duplicated near-verbatim between `MapGL` and `Camera`. |
| `Draw` | 🔴 | 3.2 (dead measurement-mode feature) + Section 2.2/4.1 (broken on current MapLibre without a class-name patch) + `mapbox-gl-draw` currency unverified (4.2). Highest-effort component to bring current. |

### 5.1 Type-import risk (cross-cutting, affects `MapGL`, `Layer`, `Control`, `Layer3D`, `Marker`, `Popup`)

14 deep internal-path type imports were found across the codebase (e.g.
`mapbox-gl/src/ui/map`, `mapbox-gl/src/geo/lng_lat.js`, `mapbox-gl/src/style-spec/types.js`,
`mapbox-gl/src/style/style_layer/custom_style_layer`, `mapbox-gl/src/ui/control/*`). These are
`import type`-only, so they don't affect runtime output — but Mapbox's Flow→TypeScript rewrite
(v3.5.0) changed the internal source layout these paths point into, and `@types/mapbox-gl`
(currently a `devDependency` here) is explicitly called out by Mapbox as no longer fully
compatible with the library's new first-class TS typings. **Action:** replace every deep
`mapbox-gl/src/...` type import with the top-level public export (`import type { Map, MapOptions,
LngLatLike, LngLatBounds, PaddingOptions, StyleSpecification, FilterSpecification,
CustomLayerInterface, ... } from "mapbox-gl"`), dropping `@types/mapbox-gl` if mapbox-gl's own
bundled types now cover everything (verify during Stage 1). This is pure type-checking risk, zero
runtime risk, but will likely surface as build breakage the moment someone updates the
`mapbox-gl` version.

**Confirmed empirically by the Stage 0 spike (`STAGE0_FINDINGS.md`), not just inferred:** every one
of these deep-path imports hard-fails (`TS2307: Cannot find module`) against any mapbox-gl ≥3.6.0,
because the published package has shipped no `src/` directory at all since that exact version.
`@types/mapbox-gl` is confirmed dead too — v3.5.0 is an empty stub with zero `.d.ts` content, so
"dropping it if redundant" is no longer a conditional, it's just correct. This repo's own lockfile
is currently pinned to `mapbox-gl@3.1.2` (a stale resolution of the `"*"` peer range), which is why
this hasn't already broken CI — the next version bump will.

### 5.2 `import.meta.env` (Vite-only) usage inside library code

`MapGL` and `Source` both read `import.meta.env.VITE_MAPBOX_ACCESS_TOKEN` /
`VITE_VECTOR_API_KEY` / `VITE_RASTER_API_KEY` directly, guarded with `//@ts-ignore`. This only
works for consumers building with Vite; a webpack/esbuild/SolidStart-with-different-bundler
consumer gets a hard crash (`import.meta.env` is `undefined` there) the moment no explicit
`apikey`/`accessToken` prop is passed. Given this is a *library* meant to be consumed by arbitrary
build setups, this should be removed or made defensive (`typeof import.meta !== "undefined" &&
import.meta.env?.VITE_...`), not assumed. Low effort, worth bundling into Stage 1.

---

## 6. Is the project still set up "the right way" for a SolidJS wrapper library?

Short answer: **mostly, with one clear tooling upgrade worth making.**

| Item | Current | Assessment |
| --- | --- | --- |
| Build tool | `rollup-preset-solid` v3 via `rollup.config.js` | Hasn't published in ~1 year — stagnant, not dead, but the community has moved to **`tsup-preset-solid`** (solidjs-community, esbuild-based, actively maintained through 2025). It auto-generates the `exports` map (including the `"solid"` condition) instead of hand-maintaining it, and is what newer Solid map-wrapper libraries (e.g. `solid-maplibre`) now use. **Recommend migrating** (Stage 4 — low risk, do last). |
| `package.json` `exports`/`"solid"` condition | Hand-written, matches the still-current pattern | Conceptually correct and required for Solid's compiler to see raw JSX in consumer apps. No design change needed — just let `tsup-preset-solid` generate it going forward instead of maintaining it by hand. |
| Peer dependency ranges | `"mapbox-gl": "*"`, `"solid-js": "*"` | Too loose for a library whose components actively depend on version-specific APIs (`setConfigProperty` is v3+ only, WebGL2-only requirements, etc.). **Recommend pinning ranges**, e.g. `"mapbox-gl": "^3.0.0"`, `"maplibre-gl": "^4.0.0 || ^5.0.0"` (as an added, currently-missing explicit peer dep — right now MapLibre users satisfy the `mapbox-gl` peer dep with the `empty-npm-package` placeholder trick and there's no real acknowledgment of `maplibre-gl` as a legitimate peer in `package.json` at all), and `"solid-js": "^1.8.0 <2.0.0"` to fail loudly rather than silently break if Solid 2.0 ever becomes the resolved version. **This is now also a prerequisite for the automated dependency updates below** — Dependabot cannot propose a version bump for a peer dependency range that already matches everything, so `mapbox-gl`/`maplibre-gl`/`solid-js` won't generate any update PRs at all until these ranges are tightened. **On why not keep `"*"` to preserve "always support the latest release":** the maintainer's original intent behind `"*"` was that a user should never be blocked from a new Mapbox/MapLibre/Solid release just because this library hadn't been manually bumped to acknowledge it yet — a reasonable goal, but `"*"` is the wrong mechanism for it, for two reasons discussed and confirmed 2026-09-07: (1) `"*"` can't distinguish "too new to have been tested yet" from "too old to work at all" — it equally permits Mapbox GL JS v1.x, which lacks several APIs this library now depends on outright; (2) peer-dependency range mismatches are non-fatal **warnings**, not install-blocking errors, under npm 7+/pnpm/yarn — a capped range like `^3.0.0` does not actually prevent a consumer from installing/running `mapbox-gl@4`, it just surfaces an honest warning instead of silence. Combined with the weekly Dependabot automation, a capped range gets the *better* version of the original goal: a proposed, CI-tested bump shows up automatically within days of a new major shipping (flagged for manual review, per the maintainer's own choice on major-bump handling), rather than "*"'s actual historical track record — years of silent incompatibility discovered only via user bug reports, which is the exact problem this whole audit exists to fix. **Decision: use capped, lower-bounded ranges (not `"*"`, not unbounded-lower-only `>=3.0.0`)** — an unbounded-lower-only range would reintroduce the same blind spot as `"*"` for *future* majors specifically, since Dependabot has nothing to propose when there's no upper bound to bump. |
| Automated dependency updates | Weekly `.github/dependabot.yml` + `.github/workflows/{ci,auto-merge}.yml` (implemented 2026-09-07, policy revised same day) | Every npm update — patch, minor, **or major** — auto-merges once the `ci.yml` build+test check passes; there is no manual-review hold for major bumps anymore (superseding the initial patch/minor-only, major-held design from earlier the same day — maintainer explicitly chose full automation gated purely on CI). If a bump breaks the build/tests, it is never merged and `ci.yml` posts a comment pinging the maintainer instead. `ci.yml` didn't exist before this change at all — the original `auto-merge.yml` merged patch bumps with **no test/build gate whatsoever**. **This policy's entire safety margin now rests on test coverage** — today that's just `MapGL/index.test.tsx` and `Terrain/index.test.tsx` (thin), not the full per-component suite Stage 3 describes. Until Stage 3 lands, a dependency update could pass CI while still silently breaking, e.g., `Source`'s restyle behavior (3.4) or `Atmosphere`'s fog/sky handling, since nothing currently exercises those paths. **Recommend treating Stage 3 as higher priority than its position in the stage ordering implies**, specifically because this automation now depends on it for real safety. See `MIGRATION.md` for the corresponding user-facing breaking-changes list this whole plan will eventually produce. |
| Test runner | Vitest + jsdom + `@solidjs/testing-library` | Correct and current stack for pure-logic tests (see Section 7). |
| TS config | `jsx: preserve`, `jsxImportSource: solid-js`, `declaration`-only emit | Still the correct pattern for a Solid library. No change needed. |
| Turf.js dependency | `@turf/area`, `@turf/center-of-mass`, `@turf/centroid`, `@turf/length`, `@turf/midpoint` as hard `dependencies` (not peer/dev) for a feature (`Draw` measurements) that's currently dead code (3.2) | Once 3.2 is resolved (finish or drop the feature), revisit whether these belong as hard dependencies at all — if the feature is kept, fine as-is; if dropped, remove ~5 dependencies from every consumer's install. |
| Repo docs structure | Per-component `README.md` (gitbook-published) + `docs/*.md` + newly added `CLAUDE.md`/`docs/COMPONENTS.md` | Reasonable, no structural change needed — just keep the per-component README and `docs/COMPONENTS.md` in sync as components change during this upgrade (several are already caught drifting, Section 3.6). |

### 6.1 Adjacent Solid map-wrapper packages worth knowing about

None of these currently match `solid-map-gl`'s breadth (Draw, Layer3D, Terrain, Camera, etc.), but
worth being aware of as prior art / competitive context:

- **`solid-maplibre`** (shishkin) — MapLibre-only *by explicit design*, built with `tsdown`
  (esbuild-based, similar spirit to `tsup-preset-solid`), Vitest, pnpm monorepo. Minimal surface
  (just `Map` + options) but a clean, modern reference for build tooling.
- **`solidjs-maplibre-gl`** (cliffordkleinsr) — early-stage, no visible tests.
- An older, less-active `solid-maplibre` (birkskyum) also exists.

None cover Mapbox GL JS + this component breadth — that remains this library's differentiator —
but `solid-maplibre`'s build setup is worth copying wholesale in Stage 4.

---

## 7. Testing strategy

### 7.1 Recommended libraries (decision already made: mocked unit tests, jsdom)

- **Test runner:** keep **Vitest** (already in place, correct choice, no change).
- **Component rendering:** keep **`@solidjs/testing-library`** (already a devDependency,
  actively maintained, correct choice).
- **Assertions:** keep **`@testing-library/jest-dom`** (already present).
- **Map mocking:** do **not** reach for `mapbox-gl-js-mock` — its own author marks it
  unmaintained/"should not be used." `headless-gl` is also effectively dead (9 years since last
  publish). Recommendation: **write a small hand-rolled mock map factory local to this repo**
  (e.g. `src/testUtils/mockMap.ts`) that implements just the subset of the `Map` API this library
  actually calls (`addSource`, `getSource`, `removeSource`, `isSourceLoaded`, `addLayer`,
  `getLayer`, `removeLayer`, `setLayoutProperty`, `setPaintProperty`, `setFilter`, `on`, `off`,
  `once`, `getStyle`, `setStyle`, `setFog`, `getFog`, `setLight`, `setTerrain`, `addControl`,
  `removeControl`, `hasControl`, `addImage`, `removeImage`, `hasImage`, `loadImage`, etc.) as
  `vi.fn()` spies with just enough behavior (return values, event emission) to drive each
  component's `createEffect`s, **plus the `Source`-object-level methods returned by
  `getSource()`** — `setData`, `setUrl`, `setTiles`, `updateImage` — since `Source`'s tests (3.4,
  3.8) are the highest-priority target and exercise exactly these (missing from an earlier pass of
  this list, added 2026-09-07). `isSourceLoaded` specifically needs to be a controllable spy (able
  to return `false` on demand) to regression-test 3.8. This is small, fully under your control,
  and won't silently rot
  like a third-party mock would. Optionally also stub `window.MapLib` with the same mock
  constructors (`Marker`, `Popup`, `NavigationControl`, ...) for the components that read off it.
  This is squarely a Stage 3 task — build the mock once, reuse it across every component's test
  file.
- **What mocked/jsdom tests *can't* catch:** actual WebGL rendering correctness, or subtleties in
  real style-swap timing (3.3/3.4 are exactly the kind of bug a mock can hide if the mock is too
  permissive — e.g. a naive mock's `getSource()` would happily keep returning a "working" stub
  forever, never reproducing the staleness bug). **Recommendation:** after fixing 3.3/3.4 based on
  code reasoning, add *one* narrow real-browser regression test later (Playwright or Vitest
  Browser Mode) specifically for "change base style while a Source/Light/Terrain is active,
  assert it's still applied after the swap" — this is the one place where a mock genuinely can't
  give you confidence. Flagging as a Stage 3.5/optional item, not blocking the mocked-test rollout
  you already decided on.

### 7.2 Per-component test list (Stage 3)

For each component, mocked-unit-test coverage should include at minimum:

- **`MapGL`**: renders container div; creates map with resolved style (shorthand resolution);
  fires `onViewportChange` on synthetic `move`/`moveend`; `config` prop calls
  `setConfigProperty` on a Mapbox-shaped mock and is a no-op (not a throw) on a MapLibre-shaped
  mock (regression test for 3.5); dark-mode style swap; **regression test for 3.9** — mount two
  consumer layers anchored to the same `beforeType`, trigger a style swap, and assert both survive
  (neither clobbers the other, matching `insertLayers`'s fixed insert-before semantics); cleanup
  calls `map.remove()`.
- **`MapProvider`**: context value updates when `map` prop changes; `ctx.mapLib`/`ctx.isMapLibre`
  are present and correct once Stage 2 lands (Section 4.1).
- **`Source`**: `addSource` called with resolved spec; `setData`/`setUrl`/`setTiles` called on
  reactive prop changes; **regression test for 3.4** — simulate a style swap (call whatever hook
  `MapGL` ends up exposing) and assert the *next* `getSource` call, not a stale reference, is what
  gets mutated; **regression test for 3.8** — set the mock's `isSourceLoaded` spy to return
  `false`, change the reactive `data`/`url`/`tiles` prop, and assert `setData`/`setUrl`/`setTiles`/
  `updateImage` is still called (not silently skipped); cleanup removes dependent layers then the
  source.
- **`Layer`**: style bucketing (`paint` vs `layout`) for representative style objects; diff-based
  update only touches changed properties; `beforeId`/`beforeType` insertion; cleanup removes
  layer.
- **`Layer3D`**: `onAdd`/`onRender` callbacks fire; scene exposed via `useScene()`; cleanup
  removes the custom layer. (Skip asserting actual Babylon/Three render output — out of scope for
  mocked tests.)
- **`Control`**: correct class resolved per `type` (**regression test for 3.6** — assert
  `"traffic"`/`"language"` either work or are removed from the type, not silently `new
  undefined()`); position changes re-add without recreating; cleanup removes control.
- **`Image`**: `addImage` called for a bitmap/URL/pattern source; `updateImage` used when
  dimensions match; pattern generation produces the expected canvas calls; cleanup removes image.
- **`Marker`** / **`Popup`**: creation/update/cleanup lifecycle; drag/open/close callbacks fire;
  popup content set via `setHTML` vs `setDOMContent` based on children type.
- **`Terrain`**: **regression test for 3.1** — assert the DEM source URL/tileSize/maxzoom actually
  differs when the map is flagged as MapLibre vs. Mapbox, once 3.1's fix lands; cleanup calls
  `setTerrain(null)`.
- **`Atmosphere`**: Mapbox path calls `setFog`; **once 4.1 lands**, MapLibre path calls `setSky`
  with MapLibre-shaped properties — this test can't be written meaningfully until the capability
  layer exists, so sequence it after Stage 2.
- **`Light`**: `setLight` called with style; **regression test for 3.3** once fixed — simulate a
  base-style swap and assert light is re-applied/preserved.
- **`Camera`**: rotation math (`lerp`/`slerp`/`easeQuad`) as pure-function unit tests (these need
  no map mock at all); user-interaction pause/resume logic; cleanup removes event listeners.
- **`Draw`**: control added with merged styles; events wired/unwired; **decide before writing
  tests** whether custom modes (3.2) are being finished or removed — don't write tests against
  dead code.
- **Supporting modules** (`events.ts`, `styles.ts`, `mapStyles.ts`): pure-function tests — style
  shorthand resolution (`"mb:light"` → URL, unknown prefix passthrough), `{apikey}`/`{r}`
  placeholder substitution, `layoutStyles`/`baseStyle` bucketing lookups.

---

## 8. Staged plan

Each stage should be its own PR/session. Stages are ordered per the agreed priority (bugs → API
modernization → tests → tooling), but within "bugs" they're roughly ordered by how localized/safe
the fix is, so you can stop after any stage and still be strictly better off than before it.

### Stage 0 — Empirical spikes (do first, informs everything else)

**Done 2026-09-07 — see `STAGE0_FINDINGS.md` for full detail.** Summary of results:

- ~~Smoke-test `@mapbox/mapbox-gl-draw` v1.5.1 against `mapbox-gl-js` v3.29 in a throwaway page.~~
  **Works with zero changes** against current mapbox-gl (v3.30.0).
- ~~Smoke-test the same Draw setup against current MapLibre (v5.x) with and without the
  `constants.classes` patch (Section 2.2).~~ **Core mouse-driven drawing already works unpatched**
  against current MapLibre (v6.7.0) — only keyboard shortcuts and control-styling cosmetics are
  affected, both fixed by the one-line patch. Section 2.2's table entry above updated accordingly;
  this materially de-risks Stage 2's Draw item and Section 9's open question 1.
- ~~Confirm whether `TerrainControl` and `setLight` exist and behave equivalently on current
  MapLibre.~~ **Both exist** on `maplibre-gl@6.7.0` (confirmed via its own shipped type
  declarations). Section 4.2 updated.
- ~~Confirm whether current `@types/mapbox-gl` still resolves cleanly against `mapbox-gl@3.29`, or
  whether the deep `mapbox-gl/src/*` type imports (5.1) already fail today.~~ **`@types/mapbox-gl`
  is now an empty stub (drop it).** The 12 deep `mapbox-gl/src/*` imports (5 files) **hard-fail**
  (`TS2307`) against any mapbox-gl ≥3.6.0 — confirmed via isolated `tsc` run. They only still
  resolve today because this repo's lockfile happens to be pinned to a stale `mapbox-gl@3.1.2`
  resolution of the `"*"` peer range; the next routine version bump breaks the build. Treat Section
  5.1 as higher priority than its Stage 2 placement suggests (see Section 6's `"*"` peer-range
  discussion — this is now concrete evidence for it, not a hypothetical).
- ~~Try `map.setStyle(newStyle, { diff: true })` on the restyle call and observe whether it
  measurably reduces flicker/tile refetch without breaking the existing old-source/old-layer merge
  logic (Section 3.4's secondary optimization).~~ **Already the default in both libraries** (and
  has been since well before this library's currently-pinned mapbox-gl@3.1.2) — `MapGL`'s existing
  `map.setStyle(style)` calls already get diff-based updates with no code change. Nothing to
  implement here.
- Not yet run: whether MapLibre's WebGL2-only stencil/context handling breaks `Layer3D`'s
  Babylon/Three path (Section 4.2) — still open for an early Stage 1/2 spike.

### Stage 1 — Correctness bugs (Section 3), no API redesign
- 3.4 Fix `Source`'s stale cached reference (highest value — likely root cause of your remembered
  rendering bug).
- 3.8 Drop `Source`'s `isSourceLoaded` guard so reactive data updates are never silently dropped
  (confirmed via a downstream bug report — bundle with 3.4 since it's the same file, but a
  separate fix).
- 3.3 Add `light` to `MapGL`'s style-swap merge object.
- 3.9 Fix `insertLayers`'s off-by-one so it inserts before the matched layer instead of replacing
  it (confirmed via the same downstream bug report — bundle with 3.3, same code path).
- 3.5 Guard `config`/`setConfigProperty` behind a feature check so it no-ops instead of throwing.
- 3.6 Resolve the `Control` `"traffic"`/`"language"` docs-vs-code drift (implement or remove).
- 3.2 Decide: finish or delete the dead `Draw` measurement-mode code. Recommend deciding based on
  Stage 0's Draw spike results — if Draw needs significant MapLibre rework anyway, that's a
  natural point to also finish (or cut) the measurement modes.
- 5.2 Remove/guard the Vite-only `import.meta.env` reads in `MapGL`/`Source`.
- 11.4 Fix `MapGL`'s default container CSS — drop `position: absolute; inset: 0; z-index: -1` and the
  all-or-nothing override behavior (Section 11). Independent of any Mapbox/MapLibre version
  concern, confirmed anti-pattern, safe to fix early.

### Stage 2 — API modernization / capability layer (Section 4)
- 3.1 + 3.7 Replace the `window.MapLib` global and the nonexistent `isMapLibre` flag with a real,
  context-carried `{ mapLib, isMapLibre }` (or equivalent), fixing both the dead Terrain branch
  and the multi-map-global-collision issue in one pass.
- 4.1 Add the `Atmosphere` MapLibre `setSky()` branch with its own prop shape.
- 4.1 Add the `Draw`-on-MapLibre class-name patch (or document the requirement clearly if you
  decide not to automate it).
- 5.1 Replace all deep `mapbox-gl/src/...` type imports with top-level `mapbox-gl` exports; drop
  `@types/mapbox-gl` if redundant.
- 2.1 Modernize `Image`'s `loadImage` usage to the Promise form (small, low-risk, bundle it here).
- 10.1-10.2 Expand `MapGL`'s `config` prop type to the full Standard/Standard Satellite schema,
  and guard it (and `slot`) behind the same "Mapbox-only, no-op on MapLibre" capability check as
  `setConfigProperty` (Section 10) — MapLibre has no equivalent and none is planned upstream.
- 12.4 Add the `DeckOverlay` component once the capability layer (`isMapLibre`) exists, since its
  docs/behavior branch on which base library is active (Section 12).
- 13.4 Extract a shared `createMapControl`-style primitive (Solid equivalent of react-map-gl's
  `useControl` hook — Section 13.5) and refactor `Control`, `Marker`, `Popup`, and the new
  `DeckOverlay` to build on it instead of each hand-rolling the same add/update/remove-control
  lifecycle.

### Stage 3 — Test suite (Section 7)
- Build the local hand-rolled map mock (`src/testUtils/mockMap.ts`).
- Write the per-component test list in Section 7.2, in this component order (roughly
  simplest/highest-value first): `mapStyles`/`styles`/`events` (pure functions, no mock needed) →
  `MapProvider` → `Source` → `Layer` → `Control` → `Terrain` → `Light` → `Atmosphere` → `Image` →
  `Marker`/`Popup` → `Camera` → `MapGL` → `Layer3D` → `Draw`.
- Wire `pnpm coverage` into CI if not already (check `.github/` — not yet audited in this pass,
  worth a quick look when Stage 3 starts).

### Stage 4 — Build tooling modernization (Section 6)
- Migrate `rollup.config.js`/`rollup-preset-solid` → `tsup-preset-solid`, letting it regenerate
  the `exports` map.
- Tighten peer dependency ranges (`mapbox-gl`, add explicit `maplibre-gl`, `solid-js`).
- Revisit whether Turf.js belongs as a hard dependency (contingent on the Stage 1 Draw decision).
- 14.2 Add TypeDoc (+ `typedoc-plugin-markdown`) as a build step generating real API-reference
  Markdown from existing JSDoc comments, committed into the repo for GitBook's Git Sync to pick up
  — independent of whether Decision B (migrating off GitBook) happens.
- 14.3 Move the ~25 live examples from separately-hosted StackBlitz projects into an `examples/`
  directory in the repo, switching docs links to `stackblitz.com/fork/github/...` folder links.
  Can be done any time — doesn't depend on anything else in this plan, good candidate to do first
  if a quick, safe win is wanted before tackling Stage 0.

---

## 9. Open questions for you before implementation starts

1. **Draw measurement modes (3.2):** finish wiring them in, or cut the feature? This materially
   changes Stage 1/3 scope for `Draw`.
2. ~~**`window.MapLib` removal (3.7)**~~ — **RESOLVED 2026-09-07:** remove outright, no
   deprecation window. Replacement is `ctx.mapLib` via `MapProvider`'s context (see the decisions
   block at the top of this document and Section 4.1).
3. **MapLibre `config`-equivalent:** given Standard Style/config has no MapLibre equivalent at
   all, should `MapGL`'s `config` prop stay Mapbox-only (documented as such), or is it worth
   investigating whether MapLibre's newer style-spec work has grown *anything* config-like since
   this research pass that could be mapped to it?
4. **CI:** I haven't yet looked at `.github/` workflows in this pass — worth a quick check at the
   start of Stage 3 to see if tests/coverage are already gated in CI or need to be added.
5. ~~**Container CSS breaking change (Section 11)**~~ — **RESOLVED 2026-09-07:** confirmed, ship
   as documented in Section 11.4/`MIGRATION.md` #1.
6. **`DeckOverlay` shape (Section 12):** confirm the "consumer passes in the overlay *class*
   (`MapboxOverlay`/`MapLibreOverlay`) as a prop, wrapper never imports `@deck.gl/*` itself" design
   — this keeps zero new dependencies (not even optional peers) but means the wrapper can't
   validate the class matches the active base library at compile time, only document it. Fine
   with that trade-off, or would you rather add `@deck.gl/mapbox`/`@deck.gl/maplibre` as optional
   peers (like `@babylonjs/core`/`three` already are for `Layer3D`) and have the component pick
   the right one internally based on `isMapLibre`?
7. **Long-term architecture (Section 13):** `react-map-gl` abandoned the single-package/`mapLib`-
   prop model this library currently uses, in favor of separate per-library build entry points
   with precise per-library types. That's a bigger lift (build-tooling work, probably paired with
   the Stage 4 `tsup-preset-solid` migration) than anything else in this plan. Do you want to (a)
   proceed with the near-term internal-adapter approach now and treat entry-point-splitting as a
   later, separate initiative to revisit once the adapter surface is well understood in practice,
   or (b) attempt the entry-point split as part of this upgrade rather than after it? Recommend
   (a) — you don't yet know how big the adapter surface will actually get, and finding out via the
   cheap internal-adapter approach first de-risks a later, larger restructuring decision.
8. **Docs platform (Section 14.2):** add TypeDoc-generated API reference alongside the current
   GitBook setup (cheap, no platform change), or also migrate off GitBook to Astro Starlight for
   native live-Solid-component embedding in the docs themselves? These are independent decisions —
   the TypeDoc addition is worth doing regardless of the answer to the second part.
9. **`Control` `type="traffic"`/`type="language"` (3.6):** implement for real (optional
   peer-dependency-gated) or remove from the documented `type` union? `MIGRATION.md` item 6
   describes both outcomes but nothing was tracking this as a decision until this line was added
   (2026-09-07 doc-consistency pass) — resolve before Stage 1 touches `Control`.

---

## 10. Mapbox Standard / Standard Satellite: config schema & the `slot` system

This section confirms your instinct was right — `slot` does supersede `beforeId`/`beforeType` for
one specific purpose, but not in general.

### 10.1 The `config` prop's schema is far from complete

`MapGL`'s `config` type currently models: `lightPreset`, `showPlaceLabels`, `showRoadLabels`,
`showPointOfInterestLabels`, `showTransitLabels`, `showLandmarkIcons`, `showLandmarkIconLabels`,
`font`. The full current Standard-style config schema (all via the same
`setConfigProperty("basemap", key, value)` mechanism — the runtime code doesn't need to change,
just the type and docs) additionally includes:

- **More boolean toggles:** `showPedestrianRoads`, `show3dObjects`, `show3dBuildings`,
  `show3dTrees`, `show3dLandmarks`, `show3dFacades`, `showAdminBoundaries`, `showIndoor`,
  `showIndoorLabels`.
- **Theme:** `theme` (`"default" | "faded" | "monochrome" | "custom"`), `theme-data` (base64
  lookup-table image, only relevant when `theme: "custom"`).
- **POI label tuning:** `colorModePointOfInterestLabels` (`"default" | "single"`),
  `backgroundPointOfInterestLabels` (`"circle" | "none"`), `densityPointOfInterestLabels`
  (`1`-`5`, default `3`), `fuelingStationModePointOfInterestLabels`.
- **~20 color-override properties:** `colorPlaceLabels`, `colorRoadLabels`, `colorCommercial`,
  `colorEducation`, `colorMedical`, `colorIndustrial`, `colorGreenspace`, `colorWater`,
  `colorLand`, `colorAdminBoundaries`, `colorPointOfInterestLabels`, `colorMotorways`,
  `colorTrunks`, `colorRoads`, `colorBuildings`, `colorBuildingHighlight`, `colorBuildingSelect`,
  `colorPlaceLabelHighlight`, `colorPlaceLabelSelect`, `colorIndoorLabelSelect`,
  `colorIndoorLabelHighlight`.

**Standard Satellite** uses the *same* `setConfigProperty`/`importId` mechanism (not a separate
API), so nothing about `MapGL`'s implementation needs to branch — but it has a different
*applicable subset*: it swaps in a combined `showRoadsAndTransit` toggle instead of separate
road/transit label toggles, and drops indoor/3D-building-family properties entirely (no vector
building layer to toggle on a satellite basemap). **Action:** widen the `config` prop's TS type to
the full list above, and note in `Map/README.md`/`docs/COMPONENTS.md` which properties are
Standard-only vs. shared with Standard Satellite, so consumers don't set a property that silently
does nothing on the style they're using.

### 10.2 `slot` vs. `beforeId`/`beforeType` — not a conflict, two different jobs

With Mapbox Standard (and Standard Satellite), the style's own built-in layers are **not
addressable by scanning `map.getStyle().layers`** the way `Layer`'s `beforeId`/`beforeType` logic
currently works — Standard's internals aren't meant to be walked and matched against. `slot`
(`"bottom" | "middle" | "top"`) is what Mapbox introduced specifically to let a custom layer
attach to a named region *within* Standard's layer stack:

- **`bottom`** — below Standard's paths/buildings/labels (good for ground-level highlight areas).
- **`middle`** — above roads/paths, below buildings/labels (good for custom fill/line overlays
  that should sit "on the ground" but under 3D structures).
- **`top`** — above POI layers, below place/transit labels (good for markers-as-layers that should
  outrank most base content but not obscure text labels).

**Conclusion, stated plainly for the codebase:** `slot` supersedes `beforeId`/`beforeType`
*specifically* for positioning a custom layer relative to Mapbox Standard's own opaque internal
layers — that's the one job `beforeId`/`beforeType` structurally cannot do against Standard, since
there's nothing to scan. It does **not** replace `beforeId`/`beforeType` in general: those remain
the correct mechanism for ordering the wrapper's *own* layers relative to each other, or for
positioning against a classic/self-authored style's named layers (Standard is not the only style
in the world, and won't be for every consumer). **Support both, simultaneously, as orthogonal
mechanisms** — no need to pick one or "translate" `beforeType` into a `slot` internally. `Layer`
already has a `slot` prop; the only real work here is documentation (explain the two mechanisms
serve different purposes) plus confirming `slot` is passed through correctly in
`updateStyle()`/the layer-add call (quick code check during Stage 2, likely already fine since
`slot: props.slot || ""` is already in `Layer/index.tsx`).

No documented precedence rule exists for setting both `slot` and `beforeId` on the same layer —
Mapbox's own examples never combine them. Don't add a runtime guard/warning for this combination;
just document that they answer different questions ("which named region" vs. "before which
specific layer").

`slot` is also a **general style-spec property**, not Standard-exclusive in principle — any style
author can declare `"type": "slot"` placeholder layers in their own custom style and target them.
In practice, Standard/Standard Satellite are the only widely-used styles that ship predefined
slots today, so treat `slot` as "usually Mapbox-Standard-specific in practice" for documentation
purposes, while the type itself stays generic.

### 10.3 MapLibre: no equivalent, and none planned

Confirmed directly from MapLibre's own maintainers (GitHub discussion, Sept 2025): **slots are not
implemented in MapLibre GL JS**, and there is an explicit maintainer statement that MapLibre does
not intend to chase this part of Mapbox's spec ("we simply don't have the resources or motivation
to do it"). There is likewise no MapLibre equivalent to Standard's config/style-import system. The
long-standing MapLibre-community workaround for layer positioning is the older technique: author
hidden placeholder/background layers in the style itself and use `beforeId` against those.

**Action:** treat both the expanded `config` schema (10.1) and `slot` (10.2) as **Mapbox-only**
features in the capability layer from Section 4.1 — feature-detect and no-op/log rather than
throwing (mirrors the existing `setConfigProperty` guard already planned), and say so plainly in
the docs. There is nothing on the MapLibre side to unify with; don't build an abstraction that
pretends otherwise.

---

## 11. Map container CSS: confirmed anti-pattern, needs a breaking fix

Your own recollection — that the injected default CSS has been hard to override, especially
around resizing and drawing content both inside and outside the map — is corroborated by both
the map libraries' own guidance and by the most widely-used comparable wrapper library's *own,
still-open* bug reports.

### 11.1 What the map libraries themselves recommend

Both Mapbox's and MapLibre's official getting-started guides ask only for a container with
explicit sizing (`#map { height: 500px; width: 100%; }`, or `position: absolute; inset: 0` **only**
in their full-viewport-app examples, as an app-level choice). Neither library's own guidance
treats the map as a background layer via `z-index: -1`, and neither bakes `position` into a
required default — sizing is left entirely to the consumer.

### 11.2 `MapGL`'s current default is worse than a known bad example

`MapGL` currently renders:

```jsx
style={
  props?.class || props?.classList
    ? null
    : props.style || { position: "absolute", inset: 0, "z-index": -1 }
}
```

i.e., unless the consumer supplies `class`/`classList`/`style`, the map is forced to
`position: absolute; inset: 0; z-index: -1` — full-bleed **behind** sibling content by default. If
a consumer supplies even one of `class`/`classList`/`style`, the *entire* default is dropped
(all-or-nothing), including basic sizing, so they must reimplement it themselves or get a
0×0 map.

For comparison, `react-map-gl` (visgl, the most widely-used React wrapper) hardcodes a similar
`position: absolute; width: 100%; height: 100%; overflow: hidden` on both its map container and
overlay div — and this generates real, still-open complaints: issue #341 ("Enable CSS position
style overrides") asks for an opt-out because the forced absolute positioning blocks consumers
from using their own layout strategy; issue #853 reports the hardcoded `overflow: hidden` on the
overlay div can only be worked around with `!important`. Neither has an official fix. **This is
negative prior art** — solid-map-gl's current default (`z-index: -1` on top of the same absolute
positioning) is a strictly more aggressive version of a pattern that's already a known pain point
in the ecosystem's most mature comparable library.

### 11.3 The pointer-events overlay trick is still fine — the delivery mechanism isn't

The `.overlay { pointer-events: none } .overlay > * { pointer-events: auto }` technique (letting
map drag/zoom pass through except where a real child element sits) is still the standard approach
for generic overlay children — no more robust alternative has emerged, and `react-map-gl` uses the
same idea. What's worth changing is *how* it's delivered: `MapGL` currently injects a fresh
`<style>` tag into the DOM on every mount rather than shipping a static stylesheet class, which
means consumers can't easily override it via normal CSS cascade/specificity and have to resort to
`!important`, same as `react-map-gl`'s users do today.

Separately, for **controls specifically** (as opposed to markers/popups/draw UI, which position
themselves and don't need the overlay div at all), the more idiomatic approach used elsewhere is
to compose directly into the base library's own `.mapboxgl-ctrl` control-corner DOM structure via
a custom `IControl`'s `onAdd()` returning a real element carrying that class — this is the
documented, supported extension point for controls on both libraries, distinct from the generic
overlay mechanism.

### 11.4 Recommendation (feeds Stage 1 of the plan)

- **Drop `position: absolute; inset: 0; z-index: -1` entirely.** Default the container to a
  minimal, trivially-overridable `width: 100%; height: 100%` — enough to avoid the common
  beginner footgun of "map renders as a 0×0 blank box," without fighting flex/grid layouts or
  forcing background-layer semantics no one asked for.
- **Make the override additive, not all-or-nothing.** A consumer-supplied `class`/`style` should
  layer on top of (or cleanly replace only) sizing, not silently also remove concerns they never
  touched. Simplest correct behavior: always apply the `width: 100%; height: 100%` default via a
  low-specificity mechanism (a real stylesheet class, not inline `style`), and let consumer
  `style`/`class`/`classList` win by normal CSS precedence rather than by an internal `? :`
  branch that deletes the whole default object.
- **Replace the injected `<style>` tag with a real shipped stylesheet class** for the
  `pointer-events` overlay trick, so it participates in normal cascade/specificity instead of
  requiring `!important` to override — directly addresses your "hard to override" complaint.
- **Document the `mapboxgl-ctrl` composition technique** as the recommended path for consumers
  building fully custom controls, as a lighter-weight alternative to the generic overlay div when
  all they need is a control-corner-docked element.
- This is a breaking visual change for any current consumer relying on the absolute/z-index
  default (see Open Question 5, Section 9) — but it's a confirmed anti-pattern independent of any
  Mapbox/MapLibre version concern, so it's sequenced into **Stage 1** (bug fixes) rather than
  waiting for the API-modernization stage.

---

## 12. deck.gl interoperability

Goal (per your request): not to bundle deck.gl, but to make sure deck.gl layers can be added
cleanly on top of a map created by this wrapper, for both the Mapbox and MapLibre paths — and to
learn from how deck.gl itself solved the same "support both base libraries" problem this wrapper
is trying to solve.

### 12.1 Current deck.gl integration surface (2026)

`MapboxLayer` (the older, single-layer-as-`CustomLayerInterface` approach — conceptually similar
to what this wrapper's own `Layer`'s `customLayer` prop and `Layer3D` already do) is **deprecated
and removed in deck.gl v9**. The current, sole recommended approach is an overlay class added as a
map **control**: construct it with a `layers` array and call `map.addControl(overlay)`. Three
rendering modes exist:

- **Overlaid** (default): deck.gl renders to its own canvas, layered on top in the controls
  container. Always safe, fully compatible with any base-map controls/plugins, no WebGL context
  sharing.
- **Interleaved** (`interleaved: true`): deck.gl layers render *inside* the base map's own WebGL2
  context, so they sort correctly against 3D buildings/labels/terrain instead of always sitting on
  top as one flat block. Requires WebGL2 (mapbox-gl ≥2.13 with `useWebGL2: true`, or mapbox-gl v3+,
  or MapLibre v3+); base maps create their context with `antialias: false`, so interleaved deck.gl
  layers get no multisampling; `useDevicePixels` is ignored in this mode. When interleaving against
  **Mapbox v3 Standard style**, deck.gl's own docs say to supply a **`slot`** prop instead of
  `beforeId` for positioning — direct confirmation of Section 10's finding, from a completely
  independent source.
- **Reverse-controlled**: deck.gl owns the container/camera, map is subordinate — rare, skip
  documenting this one, not relevant to a wrapper-library integration story.

### 12.2 How deck.gl solved "Mapbox vs. MapLibre" — directly relevant prior art

deck.gl does **not** paper over the two libraries with one shared adapter class. It ships two
separate, parallel packages implementing the same `IControl` interface: **`@deck.gl/mapbox`**
exporting `MapboxOverlay` for Mapbox GL JS, and **`@deck.gl/maplibre`** exporting `MapLibreOverlay`
for MapLibre GL JS (v4.5.1/v5/v6). The usage pattern is identical either way
(`map.addControl(new XOverlay({layers, interleaved}))`), but the *library divergence* is resolved
by maintaining two thin, parallel entry points rather than one class that runtime-detects which
library it's talking to. This is a second, independent confirmation of the same lesson from
Section 2.2/4.1 (Atmosphere's `setFog`/`setSky` split): **where the two libraries have genuinely
diverged APIs, prefer two small explicit branches/packages over one clever shared abstraction.**
(Caveat: older deck.gl 8.x/early-9.x docs and some third-party summaries describe `MapboxOverlay`
as also covering MapLibre — that's stale; verify against the deck.gl major version actually in use
before trusting any single source on this point.)

### 12.3 Minimal wrapper-side integration point

Prior art from `react-map-gl` shows the idiomatic wrapper component is intentionally tiny — create
the overlay once, forward prop updates reactively:

```js
function DeckGLOverlay(props) {
  const overlay = useControl(() => new MapboxOverlay(props))
  overlay.setProps(props)
  return null
}
```

This maps almost exactly onto this wrapper's **existing `Control` component's lifecycle**
(`src/components/Control/index.tsx`): construct once, `addControl` in an effect, update via a
reactive effect, `removeControl` in `onCleanup`. **Recommendation:** add a small new component
(tentatively `DeckOverlay`) built the same way, rather than only documenting "grab `ctx.map` via
context and wire it up yourself" — the ergonomic win (reactive `layers` prop, automatic
add/remove) is small but real, and it costs almost nothing given how closely it mirrors `Control`.

Proposed shape (for Stage 2, after the capability layer exists — see Section 8):

```jsx
<DeckOverlay overlay={MapboxOverlay} props={{ layers: [...], interleaved: true }} />
```

The consumer imports `MapboxOverlay` or `MapLibreOverlay` themselves (matching whichever base
library `MapGL` resolved to) and passes the **class**, not an instance, as a prop — the wrapper
constructs it once via `ctx.map`, forwards `props` reactively via `overlay.setProps(...)`, and
tears it down via `ctx.map.removeControl(...)` in `onCleanup`, exactly like `Control` does today.
This keeps deck.gl as a true zero-dependency integration point — `solid-map-gl` never imports
`@deck.gl/mapbox`/`@deck.gl/maplibre` itself, not even as an optional peer (contrast with
`Layer3D`, which does list `@babylonjs/core`/`three` as optional peers, since it constructs those
libraries' objects internally). See Open Question 6 (Section 9) for the alternative (add
`@deck.gl/*` as optional peers and have the component pick the right one via `isMapLibre`) if you'd
rather trade a bit of dependency surface for compile-time class/library-match checking.

### 12.4 Gotchas to document

- Consumers must import from the package matching the active base library
  (`@deck.gl/mapbox`'s `MapboxOverlay` vs. `@deck.gl/maplibre`'s `MapLibreOverlay`) — this is the
  single most likely integration mistake, since a lot of existing deck.gl documentation/discussion
  online still conflates the two packages. Document this explicitly, and consider having
  `DeckOverlay`'s docs example branch visibly on `ctx.isMapLibre` (once that capability flag exists
  per Section 4.1) to make the correct import obvious.
- Interleaved mode needs MapLibre v3+ (WebGL2) — older MapLibre silently falls back to
  overlaid-only behavior in practice; worth a doc callout, not a runtime check (the wrapper
  shouldn't need to know deck.gl's own version-gating logic).
- No licensing/naming friction for MapLibre users despite the "Mapbox"-branded package name —
  deck.gl solved that itself by shipping the separate `@deck.gl/maplibre` package, so nothing
  further needed on this wrapper's side.

---

## 13. Architecture: one shared tree vs. splitting by library — what other wrappers actually do

Prompted by the deck.gl comparison, before committing to the "single package + internal adapter"
design sketched in Section 4.1, it's worth being honest about what the rest of the ecosystem
actually does here — because the honest answer partially cuts against that plan, and the
maintainer should get to weigh in on the tradeoff with real information rather than my first
instinct.

### 13.1 deck.gl's model doesn't map cleanly onto this library's shape

deck.gl ships two fully separate packages (`@deck.gl/mapbox`, `@deck.gl/maplibre`) because its
map-library-facing surface is *one class*. Duplicating one class twice costs nothing. solid-map-gl
has ~13 components (`MapGL`, `Source`, `Layer`, `Layer3D`, `Control`, `Image`, `Marker`, `Popup`,
`Terrain`, `Atmosphere`, `Light`, `Camera`, `Draw`, plus the proposed `DeckOverlay`) where the vast
majority of the logic — source/layer CRUD, marker/popup lifecycle, camera math, layer style
diffing — has nothing to do with which base library is active. Forking all of that into two
parallel trees, deck.gl-style, would mean every future bug fix and feature lands twice. That was
my read last turn, and nothing in this round of research overturns it.

### 13.2 But no real library solves it the way I originally proposed, either

I initially proposed keeping one shared component tree with a small internal adapter object
resolved once at mount (Section 4.1's original draft). Having now surveyed the actual ecosystem,
**that specific pattern — one shared runtime tree with an internal two-object adapter bridging
library divergence — doesn't appear to exist anywhere** in the libraries checked:

- **`react-map-gl` (visgl), the most relevant and most mature comparable library, tried almost
  exactly today's solid-map-gl design** — one package, a `mapLib` prop/import selecting the
  underlying library at runtime — **and abandoned it.** Current versions (v7.1+) ship three
  separate build entry points instead: `react-map-gl/mapbox` (mapbox-gl ≥3.5.0),
  `react-map-gl/maplibre` (maplibre-gl ≥4), `react-map-gl/mapbox-legacy` (older mapbox-gl). Same
  component names and props surface across all three, but each is compiled and typed against one
  specific library — explicitly to fix two complaints that should sound familiar: MapLibre users
  being forced to install a Mapbox placeholder package (exactly the `mapbox-gl@npm:empty-npm-package`
  trick this library documents in `docs/start.md`), and imprecise types papering over real API
  differences. Notably, visgl briefly went further and spun the MapLibre entry point off into a
  fully separate repo (`react-maplibre`), then reversed that in January 2025 and folded it back
  into one repo as just another build target — i.e. they explicitly tested "two repos" and
  "one repo, three typed entry points" and picked the latter. **They did not test, or land on,
  "one shared runtime component tree with internal branching."**
- **Angular:** `ngx-mapbox-gl` and `@maplibre/ngx-maplibre-gl` (the latter an explicit fork of the
  former, now maintained under MapLibre's own GitHub org) are two fully independent codebases —
  no dual-support attempt at all in this ecosystem.
- **Svelte:** `svelte-maplibre-gl` (MIERUNE) is MapLibre-only by design (an open issue confirms
  Mapbox support is a known non-goal, not an oversight) — consistent with the broader pattern
  from earlier research of newer/smaller wrapper libraries simply not bothering with Mapbox given
  the licensing friction (not applicable here since you've already decided to keep both).

Net: every real precedent resolves the Mapbox/MapLibre split at the **package or build-entry-point
boundary**, not inside shared runtime components. Section 4.1 has been revised to still recommend
the internal-adapter approach for now (Section 13.3 explains why), but this should be understood
as "the pragmatic near-term move without precedent," not "the way established libraries do it."

### 13.3 Recommendation: adapter now, entry-point split as a later, separate decision

Given the above, three real options exist, not two:

1. **Fork everything into two component trees** (deck.gl's model). Rejected — the ~90% shared-logic
   ratio makes this the most expensive option for the least benefit, unlike deck.gl's ~0%-shared
   one-class surface.
2. **One shared component tree + internal adapter object** (Section 4.1's revised proposal). Cheap,
   incremental, fixes the concrete bugs (3.1, 3.5, Atmosphere's fog/sky gap) without any build
   tooling changes. Downside, per react-map-gl's own experience: types stay loose (a MapLibre user
   could still technically pass a Mapbox-only `config` prop and get a documented no-op rather than
   a compile error), and MapLibre-only consumers still transitively need the `mapbox-gl` peer dep
   satisfied via the placeholder-package trick.
3. **Per-library build entry points** (react-map-gl's model, e.g. `solid-map-gl/mapbox` /
   `solid-map-gl/maplibre` subpath exports from one repo/package, each pulling in only its own
   library's types and skipping the placeholder-package workaround entirely). Structurally the
   "correct" long-term answer per the strongest available prior art, but a real build-tooling
   project — likely only practical alongside the Stage 4 migration to `tsup-preset-solid`, which
   (per Section 6) already supports multi-entry-point package generation better than the current
   `rollup-preset-solid` setup.

**Recommendation: do #2 now (already reflected in the revised Section 4.1 and the Stage 2 plan),
treat #3 as a deliberate future initiative rather than folding it into this upgrade.** Reasoning:
the adapter's real surface area is still hypothetical — right now it's fog/sky, terrain defaults,
Standard-style config, and Draw's class-name patch, but Stage 2 implementation may surface more or
fewer divergence points than expected. Building the cheap version first and seeing how large/messy
the adapter object actually gets in practice is a better-informed basis for deciding whether the
bigger entry-point-split investment is worth it, rather than committing to it speculatively now.
This is Open Question 7 (Section 9) — flagged for your decision, not decided unilaterally here.

### 13.4 Other functionality/performance ideas worth borrowing (from the same research pass)

- **A shared "control" primitive.** react-map-gl's `useControl(onCreate, onAdd?, onRemove?)` hook
  is the shared foundation for its `Marker`, `Popup`, and (per their own recommendation) custom
  overlay controls like deck.gl's — create an `IControl`-like object once, add it on mount, remove
  it on cleanup. `Control/index.tsx` already implements this exact lifecycle, but only for itself;
  `Marker` and `Popup` each hand-roll their own near-identical add/update/remove logic, and the
  proposed `DeckOverlay` (Section 12) would be a fourth reimplementation. **Recommend extracting a
  small shared Solid primitive** (e.g. `createMapControl(factory, { position }) => void` in a new
  `src/lib/` or similar) that all four build on — pure de-duplication, no behavior change, low
  risk, good Stage 2 cleanup item (added to the staged plan above).
- **Native style diffing as a complementary optimization**, not a replacement, for the
  restyle-merge bugs (3.3/3.4) — see the note already added to Section 3.4. react-map-gl moved
  from a hand-rolled Immutable.js-based style diff to Mapbox's own built-in
  `setStyle(style, { diff: true })`, with a `diffing={false}` escape hatch. Worth trying as a Stage
  0 spike (added above) — likely reduces flicker/tile refetch for whatever part of the base style
  is unchanged, though it won't by itself preserve consumer-added `Source`/`Layer`/`Light` content
  across a restyle (that still needs the explicit merge logic already planned).
- **No imperative refs on `Source`/`Layer`.** react-map-gl deliberately removed imperative
  ref/handle access to `Source`/`Layer`, keeping the only imperative escape hatch at the top-level
  `Map` ref plus a `useMap()`-style context hook — this validates solid-map-gl's existing
  context-only design (`useMapContext()`, `useSourceId()`, `useScene()`) as already the right call;
  no change needed, just confirmation.
- Nothing new surfaced on SSR, clustering helpers, or viewport-transition batching in this pass —
  not flagged as gaps worth chasing further right now.

---

## 14. Documentation tooling & live examples

Prompted by the maintainer asking whether GitBook (current docs platform) and externally-hosted
StackBlitz examples (current live-demo approach) are still the right choices.

### 14.1 Correcting a factual assumption: GitBook does not extract source-code comments

The maintainer's stated reason for liking GitBook was that "it picks up the comments in the source
code and just puts it in there." **This isn't what's happening.** GitBook is a Git-synced Markdown
CMS — it publishes whatever `.md` files already exist in the repo (`README.md`, `SUMMARY.md`,
`docs/*.md`, each component's `README.md`) with no JSDoc/TSDoc extraction capability at all. The
per-component `README.md` prop tables that look like they're derived from the JSDoc comments on
prop types in the `.tsx` files (e.g. `Layer/index.tsx`'s `/** A string that uniquely identifies
the layer... */`) are hand-written and have been manually kept in sync by the maintainer — there is
currently no actual automation connecting source comments to published docs. Worth knowing before
deciding whether to keep GitBook, since "it already does this" was cited as the reason to keep it,
and it doesn't.

### 14.2 Recommendation: two independent decisions, not one

**Decision A — add real API-doc generation (low-risk, worth doing regardless of platform):** add
[TypeDoc](https://typedoc.org/) with `typedoc-plugin-markdown` as a build step that extracts the
JSDoc comments already present in the component prop types and generates real API-reference
Markdown, committed into the repo (e.g. `docs/api/`). GitBook's existing Git Sync (or any
replacement platform, per Decision B) picks up generated files exactly like hand-written ones —
this closes the actual gap identified in 14.1 without requiring any platform migration. Cheap,
additive, no breaking change, good Stage 4 (tooling) candidate.

**Decision B — whether to migrate off GitBook (separate, bigger, optional):** for a Solid-specific
library, **Astro Starlight** is a meaningfully better fit than staying on GitBook or moving to
Docusaurus/VitePress, for one concrete reason: Astro has an official `@astrojs/solid-js`
integration, so Starlight docs pages can embed real, live-rendering Solid components directly in
the page — not just static code blocks — while still Git-syncing/deploying from the same GitHub
repo (GitHub Pages/Netlify/Vercel) with comparable effort to GitBook's current Git Sync. VitePress
was checked and ruled out — it's Vue-native and its live-component-preview plugins are Vue-SFC
specific, not usable for rendering actual Solid components. Docusaurus remains the safer choice
only if versioned docs across multiple major releases matter more than native live-component
rendering (it has a more mature versioning story). Migration effort is moderate, not a rewrite —
existing Markdown/prose content ports over nearly as-is; the work is mostly config and picking a
theme. **This is optional and separate from Decision A — Decision A is worth doing either way.**
See Open Question 8 (Section 9) for the maintainer's choice here.

### 14.3 Live examples: the fix is repo structure, not new embedding tech

The maintainer's actual complaint is ~25 separately hand-maintained external StackBlitz *projects*
(one per example listed in `docs/examples.md`) silently drifting out of sync with the library as it
changes, with no visibility into when an example breaks. Two things researched and ruled
out/confirmed:

- **Sandpack** (CodeSandbox's embeddable live-code-editor component, which would otherwise be the
  obvious "embed examples directly in docs" answer) is **no longer actively maintained as of March
  2026** — do not build new infrastructure on it. It also has no first-class Solid template.
- **Solid's own official playground/REPL** (`solid-repl`) is a real Solid-native embeddable
  alternative for short inline snippets, but its repository is currently marked temporarily
  inactive (development moved to `solid-playground`) — treat as a secondary option given its own
  maintenance uncertainty, not the primary fix.

**The actual fix doesn't require adopting any new tool.** StackBlitz can open any folder of a
public GitHub repo directly via URL — `stackblitz.com/fork/github/<owner>/<repo>/tree/<branch>/<path>`
— with no separately-hosted StackBlitz project required. **Recommendation:** move the ~25 examples
into an `examples/` directory inside the `solid-map-gl` repo itself (one subfolder per example,
mirroring what `docs/examples.md` currently links out to), and change every example link in the
docs to the `stackblitz.com/fork/github/...` form pointing at that folder instead of a hand-created
StackBlitz project. Concrete benefits: examples version alongside the library (a breaking API
change makes the example visibly wrong in the repo itself, discoverable via code review or a
simple CI smoke build, instead of silently rotting in a disconnected external account); zero
ongoing StackBlitz-side maintenance; and the examples become useful test fixtures for Stage 3's
manual/real-browser verification too (Section 7.1's optional Playwright regression test could
target these same example files instead of bespoke test-only fixtures).

### 14.4 What this doesn't change

Neither decision here affects any of the API/behavior changes elsewhere in this plan — this is
pure documentation/tooling scope, safe to schedule independently (Stage 4, alongside the build-tool
migration) or even before Stage 0 if the maintainer wants a quick win, since it touches none of the
library's runtime code.
