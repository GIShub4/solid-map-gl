# Migration Guide: upcoming breaking changes

> **Status: draft / forward-looking.** This describes breaking changes that will be introduced by
> the modernization work tracked in `UPGRADE_PLAN.md`, before that work has actually shipped. It
> exists now so the scope of breakage is visible and reviewable ahead of time. As each item lands,
> move it into the real `CHANGELOG.md`/GitHub release notes for the version that ships it, and
> update or remove it here if the final implementation ends up different from what's described
> (a few items are explicitly marked **pending decision** below).
>
> None of this has been released yet. If you're reading this on `main` before a new major version
> tag, your currently-installed version is unaffected.

## Why a major version bump

This library went a long time without updates while Mapbox GL JS, MapLibre GL JS, and SolidJS all
moved forward (details in `UPGRADE_PLAN.md`). Bringing it current requires some breaking changes —
this guide exists so upgrading is a deliberate decision, not a surprise.

---

## Confirmed breaking changes

### 1. Default map container styling has changed

**Before:** `<MapGL>`'s container div defaulted to `position: absolute; inset: 0; z-index: -1` —
filling its nearest positioned ancestor and sitting *behind* sibling content — unless you supplied
`class`, `classList`, or `style`, in which case the entire default was dropped and you had to
reimplement sizing yourself.

**After:** the container defaults to a plain, in-flow `width: 100%; height: 100%`. It no longer
forces `position: absolute` or `z-index: -1`, and a supplied `class`/`classList`/`style` now layers
on top of the minimal default instead of replacing it outright.

**Why:** the old default fights normal CSS layout (flex/grid parents, resizing, rendering content
around the map) and is a known anti-pattern — even Mapbox's and MapLibre's own docs never
recommend it. See `UPGRADE_PLAN.md` Section 11 for the full reasoning.

**Migrate:** if your app relied on the map auto-filling a positioned ancestor as a full-bleed
background layer, add that explicitly:

```jsx
<MapGL style={{ position: "absolute", inset: 0, "z-index": -1 }} ... />
```

If you were already supplying your own `class`/`style` to fully control sizing, check that the new
additive default (`width: 100%; height: 100%`) doesn't conflict with rules you had that assumed no
default was present.

### 2. `window.MapLib` global removed

**Before:** `MapGL` stored whichever library it loaded (`mapbox-gl` or your supplied `mapLib`) on
`window.MapLib`, and every component read classes off that global. This was never documented as
public API, but it was accessible.

**After:** the active library (and an `isMapLibre` flag) is exposed through Solid context instead
(see `UPGRADE_PLAN.md` Section 4.1/13). A page can now safely render multiple `<MapGL>` instances
using *different* base libraries at once — the old global broke that scenario silently.

**Migrate:** if you were reading `window.MapLib.SomeClass` directly (e.g. to construct a `Marker`
or `Popup` manually outside a component), switch to `ctx.mapLib.SomeClass`, where
`const [ctx] = useMapContext()` — `ctx.mapLib` and `ctx.isMapLibre` are new keys on the same
context value that already carries `ctx.map`, so `ctx.map`'s existing property-access shape is
unaffected (confirmed 2026-09-07 — see `UPGRADE_PLAN.md`'s decisions block).

### 3. Peer dependency ranges are now enforced

**Before:** `mapbox-gl` and `solid-js` were declared as unbounded peer dependencies (`"*"`) —
any version, including very old ones, satisfied the install.

**After:** explicit minimum ranges are enforced (e.g. `mapbox-gl` requiring v3+, `solid-js` pinned
below the still-unreleased Solid 2.0, and `maplibre-gl` added as a first-class explicit peer
instead of only being usable via the `mapLib` prop workaround).

**Why:** several components now use APIs (Standard Style config, WebGL2-only assumptions) that
simply don't exist on old Mapbox GL JS v1/v2 — the old `"*"` range let those fail confusingly at
runtime instead of at install time. `"*"` was originally chosen so users could always install the
newest Mapbox/MapLibre/Solid release without waiting on this library — but a capped range doesn't
actually take that away: npm 7+/pnpm/yarn treat peer dependency mismatches as **warnings, not
install-blocking errors**. You can still install a newer major than what's declared; you'll just
see an honest peer-dependency warning instead of no signal at all. This library's own weekly
dependency automation (see `UPGRADE_PLAN.md` Section 6) will typically catch up and widen the
range within days of a new major release, tested via CI rather than assumed compatible.

**Migrate:** if your project is pinned to `mapbox-gl` v1.x or v2.x (genuinely too old, not just
"newer than currently declared"), either upgrade `mapbox-gl` alongside `solid-map-gl`, or stay on
the last pre-upgrade `solid-map-gl` version. If you're already on a recent major that just hasn't
been acknowledged in the declared range yet, you can typically ignore the warning and proceed.

### 4. `config` prop no longer throws on MapLibre — it silently no-ops instead

**Before:** passing `config` to `<MapGL>` while using MapLibre threw
`TypeError: map.setConfigProperty is not a function` from inside a reactive effect, since MapLibre
has no equivalent to Mapbox's Standard Style config system.

**After:** `config` is feature-detected; on MapLibre it's silently ignored (with a `debug()` log if
`debug`/`debugEvents` is enabled) instead of throwing.

**Why:** MapLibre has no equivalent feature and none is planned by its maintainers — see
`UPGRADE_PLAN.md` Section 10.3.

**Migrate:** nothing required unless you had code specifically depending on that crash (unlikely).
`config` and the `slot` layer-positioning prop remain Mapbox-Standard-Style-only; see the expanded
docs for the full, now much larger, list of supported `config` properties.

### 5. `Draw`'s `showLength`/`showArea` props now actually work

**Before:** these props existed but did nothing — the custom draw modes that would read them were
imported but never wired into `Draw`'s `modes` map, so the feature never worked.

**After:** `showLength`/`showArea` produce real, live length/area labels while drawing lines,
polygons, and rectangles (via the control's normal toolbar buttons — no mode-name changes needed).
`Draw` also now registers four extra opt-in modes with no built-in equivalent: `multi_point`,
`radius`, `rectangle`, `rectangle_assisted` (activate via `draw.changeMode(...)`, see
`Draw/README.md`).

**Why:** this was always the documented, advertised behavior of `showLength`/`showArea` — finishing
it (rather than deleting the dead code) was the decision made 2026-09-07 (`UPGRADE_PLAN.md` Open
Question 1).

**Migrate:** if your app was already passing `showLength`/`showArea` (which had no effect before),
your drawn UI will now show measurement labels — remove the props if you don't want that. No
migration needed otherwise.

### 6. `Atmosphere`'s `style` prop shape now distinguishes Mapbox `Fog` from MapLibre `Sky`

**Before:** `style` was typed as Mapbox's `Fog` shape only, and on MapLibre the component always
called `map.setFog(...)`, which either no-oped or threw — MapLibre has no `setFog`/`Fog` concept.

**After:** `style` is typed as `FogSpecification | MapLibreSky` (a new exported type), and
`Atmosphere` branches on `ctx.isMapLibre` to call `map.setFog(...)` (Mapbox) or `map.setSky(...)`
(MapLibre) with the correct shape for the active library.

**Why:** Mapbox's `Fog` spec and MapLibre's diverged `Sky` spec use different property names
entirely — see `UPGRADE_PLAN.md` Section 2.2/10.

**Migrate:** Mapbox-only users see no runtime change. MapLibre users who were previously passing
Mapbox-shaped `Fog` properties (which had no effect) need to switch to MapLibre's `sky` property
names (`sky-color`, `horizon-color`, `fog-color`, `atmosphere-blend`, ...) to get real atmosphere
styling.

### 7. `Control` `type="traffic"` / `type="language"` removed from the documented `type` union

**Before:** `Control/README.md` documented `type="traffic"`/`type="language"` (with install
instructions for `@mapbox/mapbox-gl-traffic`/`@mapbox/mapbox-gl-language`), but `Control`'s actual
`ControlType` union never included them — passing either value threw `new undefined(...)` at
runtime.

**After:** the docs now match the code — `type` only lists the controls that are actually
implemented (`navigation`, `scale`, `attribution`, `fullscreen`, `geolocate`, `logo`, `terrain`).
Traffic/language controls (and any other control without a built-in `type`) go through the existing
`custom` prop instead: `<Control custom={new MapboxTraffic()} />`.

**Migrate:** if you were somehow relying on `type="traffic"`/`type="language"` throwing, that
behavior is unchanged (still not a valid `type`). If you want a working traffic/language control,
install the relevant package and pass an instance via `custom`, which already worked today.

---

## Non-breaking but worth knowing about

- **`@types/mapbox-gl` and internal deep-path type imports** (`mapbox-gl/src/...`) are being
  replaced with `mapbox-gl`'s own public top-level types. This shouldn't affect normal usage
  (`import MapGL, { Viewport } from "solid-map-gl"`), only anyone importing solid-map-gl's internal
  type paths directly (unsupported).
- **`import.meta.env.VITE_MAPBOX_ACCESS_TOKEN` / `VITE_VECTOR_API_KEY` / `VITE_RASTER_API_KEY`
  auto-detection** is being guarded/deprecated since it only ever worked for Vite-based projects
  and crashed under other bundlers when no explicit `apikey`/`accessToken` was passed. If you rely
  on this today with Vite, it's recommended (not yet required) to switch to passing `apikey`/
  `options.accessToken` explicitly.
- **Build output (`dist/`) structure may change** if/when the build moves from
  `rollup-preset-solid` to `tsup-preset-solid` (`UPGRADE_PLAN.md` Section 6/8 Stage 4). The public
  `import ... from "solid-map-gl"` entry point is not expected to change; only undocumented deep
  imports like `solid-map-gl/dist/...` could be affected.

## New, purely additive functionality (not breaking, mentioned for context)

- Expanded `config` prop support for the full Mapbox Standard/Standard Satellite schema (3D
  toggles, theme, color overrides — see `UPGRADE_PLAN.md` Section 10.1).
- A new `DeckOverlay` component for integrating deck.gl layers on top of the map
  (`UPGRADE_PLAN.md` Section 12).
- `Terrain`'s MapLibre-specific DEM defaults will actually take effect for the first time (they
  were dead code — `UPGRADE_PLAN.md` Section 3.1); MapLibre users who were unknowingly getting
  broken/failing terrain tiles should see this start working correctly. Technically a behavior
  change, but strictly a fix, not a regression.
- `Source`'s reactive `data`/`url`/`tiles` updates (geojson `setData`, image `updateImage`,
  vector/raster `setUrl`/`setTiles`) will no longer be silently dropped when the source happens to
  be mid-tiling at the instant the effect runs (`UPGRADE_PLAN.md` Section 3.8). Apps that worked
  around this by bypassing `<Source>`'s reactive update (e.g. calling `map.getSource(id).setData()`
  directly) can remove that workaround once this ships.
- After a base-style swap, restoring the app's own layers no longer clobbers another layer that
  shares the same `beforeType`/`beforeId` anchor (`UPGRADE_PLAN.md` Section 3.9, the `insertLayers`
  off-by-one). Apps that worked around this with a `style.load` listener re-adding dropped layers
  can remove that workaround once this ships.
- `useMapContext()`'s returned context gains two new keys, `ctx.mapLib` (the resolved
  Mapbox/MapLibre module — the direct, documented replacement for reading `window.MapLib`) and
  `ctx.isMapLibre` (boolean). `ctx.map` itself is unaffected — the context stays on `createStore`
  rather than moving to `createSignal`, specifically so this stays additive rather than breaking
  (`UPGRADE_PLAN.md` decisions block, 2026-09-07).
