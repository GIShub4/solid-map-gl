# Stage 0 spike findings (2026-09-07)

Empirical results for the five spikes listed in `UPGRADE_PLAN.md` Section 8, Stage 0. Methodology:
a throwaway workspace at `spike/` (gitignored, not part of the package) with real, current installs of
`mapbox-gl@3.30.0`, `maplibre-gl@6.7.0`, `@mapbox/mapbox-gl-draw@1.5.1`, loaded in an actual Chrome
tab (via the `claude-in-chrome` browser tool) — not just static source reading. `spike/` is left in
place, gitignored, in case any of this needs re-running; delete it whenever it's no longer useful.

## 1–2. `@mapbox/mapbox-gl-draw@1.5.1` vs. current mapbox-gl (v3.30) and MapLibre (v6.7)

**mapbox-gl@3.30.0: works with no changes.** Loaded a real map, activated `draw_point`, dispatched a
synthetic click on the canvas, `draw.getAll()` returned 1 feature. No console errors.

**MapLibre@6.7.0: works better than `UPGRADE_PLAN.md` Section 2.2 predicted.** The plan's claim
("Draw is very likely non-functional against current MapLibre out of the box") is **overstated** —
verified empirically:

- **Mouse-driven drawing works fine, unpatched.** Clicking to place a point, and by extension
  line/polygon vertex placement and the trash-button click, go through the map's own abstracted
  mouse-event system, not raw DOM class inspection. A point was created successfully with zero
  patching.
- **The only concretely broken behavior is keyboard shortcuts** (Delete/Backspace to remove the
  selected feature, digit keys `1`/`2`/`3` to switch draw mode). I traced this to a single line,
  `mapbox-gl-draw/src/events.js:132`: `event.target.classList.contains(Constants.classes.CANVAS)`
  (hardcoded `'mapboxgl-canvas'`) gates `events.keydown` — this is the *only* place in Draw's source
  that reads `classes.CANVAS`. MapLibre's actual canvas class is `maplibregl-canvas`, so this check
  is always `false` unpatched. Confirmed by direct test: with a feature selected in `simple_select`
  mode, a synthetic `Backspace` keydown left the feature count at 1 unpatched, and deleted it
  (count → 0) with the one-line class patch applied.
- **`CONTROL_BASE`/`CONTROL_GROUP` are used once**, purely for the draw control's own wrapper
  `<div>` className (`ui.js:103`) — cosmetic only. Unpatched, the control renders with Draw's own
  fallback box styling but not MapLibre's native control look (confirmed visually: unpatched
  buttons render as a plain side-by-side row; patched buttons render as MapLibre's usual
  vertically-stacked, rounded, native-styled control group). `CONTROL_PREFIX` and `ATTRIBUTION` are
  declared in `constants.js` but never actually read anywhere in Draw's own source — dead constants
  from Draw's perspective.
- **The documented community patch fully fixes both issues** — a one-line
  `Object.assign(MapboxDraw.constants.classes, { CANVAS: 'maplibregl-canvas', CONTROL_BASE:
  'maplibregl-ctrl', CONTROL_PREFIX: 'maplibregl-ctrl-', CONTROL_GROUP: 'maplibregl-ctrl-group',
  ATTRIBUTION: 'maplibregl-ctrl-attrib' })` before instantiating `MapboxDraw`.

**Revised recommendation for Stage 2 (`UPGRADE_PLAN.md` 4.1's Draw item):** the "MapLibre
compatibility shim" is smaller and lower-risk than the plan assumed — one `Object.assign` on
`MapboxDraw.constants.classes`, gated on `ctx.isMapLibre`, before `new MapboxDraw(...)`. It is not a
prerequisite for *basic* Draw functionality on MapLibre (that already works), only for keyboard
shortcuts and native-look control styling. This also lowers the stakes on Section 9's open question
1 (finish vs. cut the measurement-mode dead code) — that decision is now fully independent of
MapLibre compatibility, since baseline Draw already works there either way.

## 3. `TerrainControl` / `setLight` on current MapLibre

**Both exist**, resolving `UPGRADE_PLAN.md` Section 4.2's open item. Confirmed via
`maplibre-gl@6.7.0`'s own shipped type declarations (`dist/maplibre-gl.d.ts`):

- `TerrainControl` is a real exported class (`declare class TerrainControl implements IControl`),
  present in the package's public export list.
- `setLight(light: LightSpecification, options?): this`, `getLight(): LightSpecification`, and the
  `light` style-spec property all exist, matching Mapbox's shape closely enough
  (`LightSpecification` type). No further action needed beyond what `Light`/`Control` already do —
  no MapLibre-specific branching required for these two.

## 4. `@types/mapbox-gl` vs. current `mapbox-gl`, and the deep `mapbox-gl/src/*` imports

**`@types/mapbox-gl@3.5.0` is now an empty stub** — `npm install` prints
`npm warn deprecated @types/mapbox-gl@3.5.0: This is a stub types definition. mapbox-gl provides its
own type definitions, so you do not need this installed.` and the package genuinely contains zero
`.d.ts` content (just `LICENSE`/`README.md`/`package.json`). **Recommendation: drop it from
`devDependencies` outright in Stage 1/2** — it does nothing today.

**All 12 deep `mapbox-gl/src/*` type imports (across `MapGL`, `Layer`, `Control`, `Source`,
`Image` — 5 files) hard-fail** against any current mapbox-gl. Confirmed two ways:
- The published npm package for mapbox-gl has shipped **no `src/` directory at all** (dist-only)
  since **exactly v3.6.0** (bisected: present through 3.5.0, gone from 3.6.0 onward — one minor
  version after the Flow→TS rewrite landed in 3.5.0).
- Ran `tsc` in an isolated environment (outside this repo's node_modules ancestor chain, to avoid
  false negatives from Node's upward module resolution) against the repo's actual 12 import
  specifiers with `mapbox-gl@3.30.0` installed: all 12 fail with `TS2307: Cannot find module`, a
  hard compile error regardless of `strict`/`noImplicitAny` (this repo's `tsconfig.json` has neither
  set).

**This is not a future risk, it's a landmine under the current setup.** This repo's own
`pnpm-lock.yaml` currently resolves the `"mapbox-gl": "*"` peer dependency to **`mapbox-gl@3.1.2`**
— a stale resolution from whenever `pnpm install` last ran, nowhere near latest (3.30.0) despite the
unbounded range. `mapbox-gl@3.1.2` still ships `src/`, so the deep imports silently resolve today
(re-verified: `tsc` against 3.1.2 with this repo's actual non-strict `tsconfig.json` produces zero
errors — they just resolve to implicit `any`, which is silently accepted). **The instant this lockfile
is regenerated against anything ≥3.6.0 — including via the new Dependabot automation
(`UPGRADE_PLAN.md` Section 6), which will happily propose exactly this bump once peer ranges are
tightened — all 5 files hard-fail to typecheck.** This is concrete, first-hand evidence for Section
6's argument against `"*"` peer ranges: the range already permits a version that breaks the build,
and the only reason it hasn't happened yet is an accident of when the lockfile was last generated.

**Recommendation:** treat Section 5.1's deep-import replacement as higher priority than its Stage 2
placement suggests — bundle it with Section 6's peer-range tightening (Stage 4) or pull it forward,
since tightening the `mapbox-gl` peer range without first fixing the deep imports will make the
*next* routine dependency bump a guaranteed build break, not a hypothetical one.

## 5. `map.setStyle(newStyle, { diff: true })` on the restyle call

**Already the default — no code change needed.** Checked both current libraries' own docs/types:

- `maplibre-gl@6.7.0`'s `StyleSwapOptions.diff` doc comment: *"If false, force a 'full' update,
  removing the current style... instead of attempting a diff-based update"* — i.e., diff-based
  update already happens unless you explicitly pass `diff: false`.
- `mapbox-gl`'s own JSDoc (checked against the actually-locked `3.1.2`, not just current 3.30):
  `@param {boolean} [options.diff=true]` — this has been the default for a long time, not a new
  v3.x thing.

`MapGL`'s actual restyle code (`src/components/MapGL/index.tsx:367,371`) calls `map.setStyle(style)`
and `map.setStyle({...})` with **no options object at all** in both places — meaning both the
initial base-style swap and the old-sources/old-layers merge-back call already get diff-based
updates for free, on every mapbox-gl/maplibre-gl version this library could plausibly run against.

**Recommendation:** close out Section 3.4's "secondary optimization, worth a Stage 0 spike" as
resolved/moot — there's nothing to implement here. The actual 3.4 fix (not caching `source` across
restyles) remains a real, separate bug and is unaffected by this finding.

## Incidental findings (testing methodology, not library bugs)

- **Background-tab throttling stalls mapbox-gl/maplibre-gl entirely.** Chrome throttles
  `requestAnimationFrame` in hidden/unfocused tabs, and both libraries' style/tile load sequences
  are rAF-driven — a map opened in a backgrounded automation tab will sit at `loaded() === false`
  indefinitely with zero errors. Taking a screenshot (which foregrounds the tab) was enough to
  unstick it every time this came up. Worth remembering for any future browser-based testing of this
  library (including the real-browser regression test floated in Section 7.1).
- **Vite's dev server is not a neutral static host for this kind of spike.** It (a) rewrites classic
  `<script src>`-loaded `.js` files with ESM `import` injections even when not requested as a
  module, breaking UMD bundles like `mapbox-gl.js`'s CDN build, and (b) refuses to let a `/public`
  (raw-passthrough) file be the target of an `import` statement at all
  (`[plugin:vite:import-analysis] Cannot import non-asset file ... which is inside /public`). Ended
  up serving the vendor bundles from a plain `python3 -m http.server` instead, which has neither
  problem — closer to how a consumer's actual bundler-free `<script>`/CDN usage behaves anyway.
- **`maplibre-gl@6.7.0` ships ESM-only** (`dist/maplibre-gl.mjs`, no UMD build), a change from
  older MapLibre versions that did ship a UMD bundle — relevant if any docs/examples assume a plain
  `<script src>` MapLibre include still works.
- Confirms **mapbox-gl is now on 3.30.0** and **MapLibre's v6 transition (mentioned as
  "underway" in `UPGRADE_PLAN.md` Section 2.2) has completed** — current MapLibre is 6.7.0, not the
  5.22–5.24 range the original research pass saw.
