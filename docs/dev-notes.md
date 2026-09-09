# Dev notes

Working notes for maintainers/future sessions: why past decisions were made, and what's been
investigated but not yet fixed. Not user-facing — see `CHANGELOG.md` for the breaking-changes list
that actually ships to consumers.

## Migration decisions

A decision log from the Mapbox GL JS v3 / MapLibre GL JS modernization pass (2026-09-07). This is
a record of *why*, kept so a future session doesn't re-litigate a choice that was already made
deliberately.

### Scope & ground rules

- Keep supporting **both** Mapbox GL JS and MapLibre GL JS — dropping one was never on the table.
- Breaking changes to the public API are acceptable: the library had gone a long time without a
  release, so there was no compatibility guarantee worth preserving over fixing real bugs.
- Testing strategy: mocked unit tests (jsdom + a hand-rolled `src/testUtils/mockMap.ts`), not
  real-browser tests, for the first pass. Third-party map mocks were considered and rejected —
  `mapbox-gl-js-mock`'s own author marks it unmaintained, and `headless-gl` hasn't published in
  9 years.
- Work order: correctness bugs → API modernization → tests → build tooling, so the project stayed
  strictly better off if work stopped after any one stage.

### Capability layer: internal adapter now, not a package split

Three real options existed for the Mapbox/MapLibre divergence (fog vs. sky, Standard-style config,
Draw's class names, terrain DEM defaults):

1. Fork the whole component tree per library (deck.gl's model) — rejected. deck.gl's surface is
   one class, so duplicating it costs nothing; solid-map-gl has ~13 components where the vast
   majority of logic (source/layer CRUD, marker/popup lifecycle, camera math) has nothing to do
   with which library is active. Forking all of that would mean every bug fix lands twice.
2. **One shared component tree + a small internal `{ mapLib, isMapLibre }` adapter — chosen.**
   Cheap, incremental, no build-tooling changes required.
3. Per-library build entry points (`solid-map-gl/mapbox`, `solid-map-gl/maplibre`), matching what
   `react-map-gl` moved to after trying (and abandoning) the exact single-package/`mapLib`-prop
   model this library still uses today. Structurally the "correct" long-term answer per the
   strongest available prior art, but a real build-tooling project.

Went with #2 because the actual adapter surface (fog/sky, terrain defaults, Standard-style config,
Draw's class-name patch) was still hypothetical before implementation — building the cheap version
first and seeing how large it actually gets in practice is a better-informed basis for deciding
whether #3 is worth it later. **Not revisited since — still an open decision if the adapter ever
gets unwieldy.**

### `window.MapLib` removed outright, no deprecation window

Replaced by `ctx.mapLib`/`ctx.isMapLibre` on `MapProvider`'s context. No compatibility shim was
added — the global was already silently broken for any page rendering two `<MapGL>` instances with
different libraries (whichever mounted last won), so there was nothing worth preserving compat
with.

### `MapProvider` stays on `createStore`, not `createSignal`

An earlier pass in this audit recommended switching to `createSignal`, since storing one
non-nested `map` value in a `createStore` didn't fit the "stores earn their keep with nested/keyed
reactivity" rule. Reversed once `mapLib`/`isMapLibre` were added alongside `map` in the same
context value — three keyed values is exactly the case a store is for, and switching to a signal
at that point would have broken `ctx.map`'s existing property-access shape for no remaining
benefit.

### Container CSS default: drop `position: absolute; z-index: -1`

The old default fought normal CSS layout (flex/grid parents, resizing) and is a known anti-pattern
that neither Mapbox's nor MapLibre's own docs ever recommend. Checked against `react-map-gl`
(visgl) for comparison: it has the same category of complaint open against its own hardcoded
`position: absolute` default (issue #341) with no official fix — negative prior art, not a reason
to keep ours. New default: minimal, additive `width: 100%; height: 100%` that layers under
consumer `style`/`class` instead of being replaced by it.

### `Draw`'s measurement modes: finish, don't cut

`showLength`/`showArea` were documented as working props but were ~1000 lines of dead code — the
custom draw modes that would compute them were imported but never registered into `Draw`'s modes
map. Decided to finish wiring them in rather than delete the feature, since working measurement
labels was always the advertised, intended behavior, not speculative scope creep.

### Turf.js dependencies stay as hard `dependencies`

Downstream of the Draw decision above: since the measurement modes were kept (not cut), the
`@turf/*` packages they call into (`getLength`/`getArea`) stay declared as regular dependencies
rather than being made optional or moved to peer dependencies.

### `DeckOverlay`: consumer supplies the overlay class, zero deck.gl dependency

Mirrors deck.gl's own solution to the exact same Mapbox/MapLibre split: it ships two parallel
packages, `@deck.gl/mapbox`'s `MapboxOverlay` and `@deck.gl/maplibre`'s `MapLibreOverlay`, both
implementing `IControl`. `solid-map-gl` never imports `@deck.gl/*`, not even as an optional peer —
the consumer passes the class as a prop, and `DeckOverlay` constructs/manages it exactly like
`Control` does for any other `IControl`. Trades a small amount of compile-time class/library-match
checking for zero added dependency surface; revisit only if that checking turns out to matter in
practice.

### Peer dependency ranges: capped, not `"*"` or unbounded-lower-only

`"*"` couldn't distinguish "too new to have been tested yet" from "too old to work at all" — it
equally permitted Mapbox GL JS v1.x, which lacks APIs this library now depends on outright.
Peer-range mismatches are warnings, not install-blocking errors, under npm 7+/pnpm/yarn, so a
capped range (`^3.0.0`) doesn't actually block a newer major from installing — it just surfaces an
honest warning instead of silence, and the weekly Dependabot automation typically widens the range
within days of a real new major anyway. An unbounded-lower-only range (`>=3.0.0`) was also
rejected: Dependabot has nothing to propose for a peer range with no upper bound to bump, which
would have quietly reintroduced the exact blind spot `"*"` had.

### Dependency automation: full auto-merge gated purely on CI

Every npm update — patch, minor, or major — auto-merges once `ci.yml`'s build+test check passes;
there's no manual-review hold for major bumps. This whole policy's safety margin rests on the test
suite added alongside it (97 tests covering every component, including regression tests for each
bug fixed in this pass) actually catching what a bad bump would break.

### Docs: add TypeDoc now, defer the GitBook question

Two independent decisions, not one:

- **Add TypeDoc-generated API reference** — done, committed to `docs/api/`. Low-risk and worth
  doing regardless of platform; corrected a factual assumption along the way that GitBook already
  extracted source comments into docs (it doesn't — it's a Git-synced Markdown CMS with no JSDoc
  extraction; the per-component README prop tables have always been hand-written).
- **Migrate off GitBook to Astro Starlight** (for native live-Solid-component embedding in docs
  pages) — **still open, not started.** Optional and separate from the TypeDoc addition.

### Examples moved into the repo

The ~30 live examples move from separately hand-maintained external StackBlitz projects into
`examples/` in this repo (one subfolder each), linked via
`stackblitz.com/fork/github/GIShub4/solid-map-gl/tree/main/examples/<slug>` instead of
hand-created StackBlitz projects. Fixes examples silently drifting out of sync with the library as
it changes with no visibility into when one breaks.

### Still open / deferred

- **MapLibre `config`-equivalent:** no MapLibre equivalent to Mapbox Standard Style's `config`
  exists today, and MapLibre's maintainers have stated they don't intend to chase Mapbox's `slot`
  system either. Worth re-checking only if MapLibre's own style-spec work grows something
  config-like later — nothing to build today.
- **`Layer3D`'s WebGL2-only stencil handling on MapLibre:** not yet empirically verified against
  the Babylon/Three render path in practice, only flagged as a theoretical risk.

## Future improvements

Findings from investigating open GitHub issues that are real but not fixed yet. Recorded here so
the root cause isn't lost before someone picks the work up.

### #158 — `<MapGL>` throws unhandled errors under Vitest/jsdom (or any WebGL-less environment)

The issue itself only contained two screenshots (no description), reproduced here since they pin
down the exact failure:

**Screenshot 1** — unhandled rejection:
```
Error: Mapbox GL not supported
  at node_modules/solid-map-gl/dist/source/components/MapGL/index.jsx:52:13
```

**Screenshot 2** — uncaught exception, thrown from a later render/prop update in the same test run:
```
TypeError: Cannot read properties of undefined (reading 'stop')
  at MapGL.createEffect.on.defer  node_modules/solid-map-gl/dist/source/components/MapGL/index.jsx:190:9
```

**Root cause (confirmed against current `src/components/MapGL/index.tsx`, 2026-09-09):**

Two separate bugs compound here:

1. **`onMount`'s async setup has no error handling.** In `MapGL/index.tsx`, `onMount(async () => {
   ... if (!mapLib.supported()) throw new Error("Mapbox GL not supported"); ... })` — Solid does not
   await or attach a `.catch()` to the callback's returned promise, so a thrown error inside it
   becomes an **unhandled promise rejection** instead of something the consumer (or the test runner)
   can react to. `mapLib.supported()` returns `false` in jsdom by default (no WebGL), so *any*
   component that mounts `<MapGL>` under Vitest + jsdom hits this on every test run, regardless of
   what the test is actually asserting.

2. **The viewport-sync effect is missing the `!map` guard the other effects have.** `map` is declared
   as `let map: Map` and only assigned inside the `onMount` callback, after the `supported()` check.
   If that check throws, `map` stays `undefined` for the lifetime of the component. Three other
   effects in the same file already guard against this —
   `if (!map || !proj) return;` (projection, line 421), `if (!map || !cur) return;` (cursor, line
   429), and line 492's prop-watching effect — but the **viewport-sync effect** (`createEffect(on(()
   => props.viewport, ..., { defer: true }))`, ~line 359) has no such check. It calls `map.stop()`
   unconditionally as soon as `props.viewport` changes after mount, which throws the `TypeError`
   from screenshot 1 the moment a test (or app) updates the viewport prop after the map failed to
   construct.

Why this matters beyond the original report: it means `<MapGL>` has no graceful degradation path in
*any* environment without WebGL (old/locked-down browsers, headless rendering, CI screenshot
tools), not only Vitest. Right now the only way a consumer finds out is via an unhandled rejection
in their console/error tracker.

**Suggested fixes (not applied — future work):**

- Add `if (!map) return;` to the viewport-sync effect, consistent with the other three effects.
  Small, low-risk, directly stops the `TypeError`.
- Wrap the `onMount` body in `try/catch` and surface failures through an explicit callback (e.g.
  `props.onError?.(err)`) instead of letting them become an unhandled rejection. This is the bigger
  design decision — needs a prop addition and a documented contract for what consumers should do
  with it (show a fallback UI, etc.).
- Longer-term, consider exporting the library's own internal test doubles
  (`src/testUtils/mockMap.ts`, `src/testUtils/renderWithMap.ts`) as a public `solid-map-gl/testing`
  entry point. The library already solves "how do I render a component that uses `<MapGL>` without a
  real WebGL context" for its own test suite; consumers currently have no supported way to reuse
  that and have to reinvent it (or hit exactly this bug).

### #166 — cluster + individual-pin layer race (deferred)

Not investigated yet — tracked for a dedicated session. Needs a real vector-tile source with
clustering enabled plus a timing-sensitive repro (the original report says the glitch is
non-deterministic across refreshes), which is a heavier setup than issue #158 above.
