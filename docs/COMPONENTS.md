# Component Reference

Technical reference for every exported component in `solid-map-gl`, generated from the source in
`src/components/`. This complements the tutorial-style docs in `docs/start.md`, `docs/styles.md`,
`docs/examples.md`, and each component's own `README.md` (which are wired into the published
GitBook via `SUMMARY.md`). For architectural background (context flow, `window.MapLib`, style
diffing, event wiring) see `CLAUDE.md` at the repo root.

All components except `MapGL` must be rendered as a descendant of `<MapGL>`, since they read the
map instance via `useMapContext()`.

## Table of contents

- [MapGL](#mapgl)
- [MapProvider](#mapprovider)
- [Source](#source)
- [Layer](#layer)
- [Layer3D](#layer3d)
- [Control](#control)
- [Image](#image)
- [Marker](#marker)
- [Popup](#popup)
- [Terrain](#terrain)
- [Atmosphere](#atmosphere)
- [Light](#light)
- [Camera](#camera)
- [Draw](#draw)
- [Supporting modules](#supporting-modules)

---

## MapGL

`src/components/MapGL/index.tsx` — default export of the package.

The root component. Creates the `mapboxgl.Map` (or `maplibregl.Map`, via `mapLib`) instance in
`onMount`, resolves style shorthands (see [mapStyles](#supporting-modules)), wires up every
`mapEvents` entry from `src/events.ts`, tracks dark-mode via `matchMedia` + a `MutationObserver`
on `document.body`'s `dark` class, observes container resize, and republishes the live viewport
(`center`/`zoom`/`pitch`/`bearing`/`point`/`inTransit`) through `onViewportChange` on `move` /
`moveend`. Once the map fires `load`, it renders `<MapProvider>` around `children` inside an
absolutely-positioned `.overlay` div (`pointer-events: none` except for real children) so overlay
components can sit on top of the canvas.

### Props

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | ID for the map container element |
| `style` | `JSX.CSSProperties` | CSS style for the map container |
| `class` | `string` | CSS class for the map container |
| `classList` | `{[k: string]: boolean}` | SolidJS classList for the map container |
| `viewport` | `Viewport` | Current viewport: `center`, `zoom`, `pitch`, `bearing`, `bounds`, `padding`, `point`, `inTransit` |
| `onViewportChange` | `(viewport: Viewport) => void` | Called on every map move; drives controlled viewport state |
| `options` | `MapboxOptions` | Passed straight to `new mapboxgl.Map()` |
| `config` | `object` | Mapbox Standard Style config properties (`lightPreset`, `showPlaceLabels`, ...), applied via `setConfigProperty` |
| `transitionType` | `"flyTo" \| "easeTo" \| "jumpTo"` | Camera transition used when `viewport` changes externally (default `flyTo`) |
| `onUserInteraction` | `(user: boolean) => void` | Fires `true`/`false` around user-driven mouse/touch/wheel interaction |
| `showTileBoundaries` / `showTerrainWireframe` / `showPadding` / `showCollisionBoxes` / `showOverdrawInspector` | `boolean` | Debug overlays, mapped 1:1 to the same `map.*` boolean flags |
| `cursorStyle` | `string` | CSS cursor applied to the map canvas |
| `darkStyle` | `StyleSpecification \| string` | Style used instead of `options.style` when dark mode is active |
| `disableResize` | `boolean` | Disable the `ResizeObserver` that calls `map.resize()` |
| `mapLib` | `any` | Pass the MapLibre (or other compatible) module instead of dynamically importing `mapbox-gl` |
| `apikey` | `string` | API key substituted into `{apikey}` placeholders in style/tile URLs |
| `debug` / `debugEvents` | `boolean` | Enable `[MapGL]` console.debug logging |
| `on[Event]` | see `mapEventTypes` in `src/events.ts` | Any Mapbox map event, e.g. `onMouseMove`, `onClick`, `onLoad` |
| `children` | `JSX.Element` | Rendered once the map has loaded, inside `MapProvider` |

`*required` fields: none — `viewport`/`options` are optional; an uncontrolled `<MapGL>` renders a
static, non-interactive map.

### Minimal example

```jsx
import { createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const [viewport, setViewport] = createSignal({ center: [-122.41, 37.78], zoom: 11 } as Viewport);

const App = () => (
  <MapGL
    options={{ style: "mb:light" }}
    viewport={viewport()}
    onViewportChange={(v: Viewport) => setViewport(v)}
  />
);
```

---

## MapProvider

`src/components/MapProvider/index.tsx` — internal plumbing, exported for advanced use.

A tiny `solid-js/store`-backed context holding `{ map }`. `MapGL` renders this automatically;
you normally never instantiate it yourself. Exposes `useMapContext()`, which every other
component calls to reach `ctx.map` (the live `mapboxgl.Map`/`maplibregl.Map` instance, extended
with `debug`, `debugEvents`, `sourceIdList`, `layerIdList`).

```ts
const [ctx] = useMapContext();
ctx.map.flyTo({ center: [0, 0] });
```

---

## Source

`src/components/Source/index.tsx`

Wraps `map.addSource`/`removeSource`. Generates an id via `createUniqueId()` if `id` isn't given,
and provides it to descendants through `SourceContext` (`useSourceId()`) so a nested `<Layer>`
doesn't need to repeat it. Resolves `raster` shorthand URLs (`osm:org`, `carto:voyager`, ...) via
`rasterStyleList` (see [mapStyles](#supporting-modules)), substituting `{apikey}` and the `{s}`
subdomain (`a`/`b`/`c`) / `{r}` retina placeholders. Reacts to changes in `source.data` (GeoJSON),
`source.url`/`coordinates` (image), `source.url`/`tiles` (vector), and raster URL/tiles, calling
the matching `setData`/`updateImage`/`setUrl`/`setTiles` API instead of recreating the source.
On cleanup, removes any layers still referencing this source before removing the source itself.

### Props

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | Required only if child `Layer`s aren't nested inside this `Source` |
| `source`\* | [`SourceSpecification`](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources) | Source spec — `geojson`, `vector`, `raster`, `raster-dem`, `image`, `video`, etc. |
| `children` | any | Layers (or anything) associated with this source |

### Example

```jsx
<Source source={{ type: "geojson", data: "https://.../earthquakes.geojson" }}>
  <Layer style={{ type: "circle", paint: { "circle-radius": 5, "circle-color": "red" } }} />
</Source>
```

---

## Layer

`src/components/Layer/index.tsx`

Wraps `map.addLayer`/`removeLayer`. `sourceId` defaults to `style.source`, then to the nearest
`useSourceId()` from a parent `Source`. `style` is a flat Mapbox layer-style object; `updateStyle`
(using `baseStyle`/`layoutStyles` from `src/styles.ts`) buckets each key into `paint` vs. `layout`
automatically. On every reactive update, `diff()` compares the new bucketed style against the
previous one and calls only the matching `setLayoutProperty`/`setPaintProperty`/`setFilter`/
`setLayerZoomRange` — the layer itself is never removed and re-added for a style change. Supports
inserting relative to existing layers via `beforeId`/`beforeType` (recorded in
`layer.metadata.smg` so it survives base-style swaps, see `MapGL`'s `insertLayers`). Also supports
raw `customLayer` (a `CustomLayerInterface`, e.g. for deck.gl) instead of `style`, and per-layer
feature state via `featureState`.

### Props

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | Layer id; generated if omitted |
| `style` | [`StyleSpecification`](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/) | Flat layer style (paint + layout properties mixed at the top level) |
| `customLayer` | [`CustomLayerInterface`](https://docs.mapbox.com/mapbox-gl-js/api/properties/#customlayerinterface) | Use instead of `style` for custom WebGL layers (e.g. deck.gl) |
| `filter` | `FilterSpecification` | Filter expression |
| `visible` | `boolean` | Toggles the `visibility` layout property |
| `sourceId` | `string` | Overrides the inherited source id (required for some vector-tile setups) |
| `slot` | `"bottom" \| "middle" \| "top" \| string` | Mapbox Standard Style slot |
| `beforeType` | `string` | Insert before the first layer of this Mapbox layer type |
| `beforeId` | `string` | Insert before this layer id |
| `featureState` | `{ id: number \| string, state: object }` | Sets feature state on `style["source-layer"]` |
| `on[Event]` | see `layerEventTypes` in `src/events.ts` | Per-layer event, e.g. `onClick`, `onMouseEnter` |
| `children` | any | Rendered as-is (layers have no natural children in Mapbox, but this allows composition) |

### Example

```jsx
<Source source={{ type: "geojson", data: earthquakesUrl }}>
  <Layer style={{ type: "circle", paint: { "circle-radius": 5, "circle-color": "red" } }} />
</Source>
```

---

## Layer3D

`src/components/Layer3D/index.tsx`

Adds a `type: "custom"`, `renderingMode: "3d"` Mapbox layer and bridges it to either
[BabylonJS](https://www.babylonjs.com/) (`babylon` prop) or [ThreeJS](https://threejs.org/)
(default), dynamically importing whichever is needed. Converts `origin` (lng/lat/altitude) to a
Mercator-space world matrix so 3D content can be authored in real-world meters around that origin.
`onAdd(scene, map, gl)` is called once the layer's `onAdd` fires — load your models/meshes there.
`onRender(gl, matrix)` runs every frame after the scene has been rendered, alongside
`map.triggerRepaint()`. Exposes the created scene to descendants via `useScene()`.

### Props

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | Layer id; generated if omitted |
| `origin` | `[number, number, number?]` | `[lng, lat, altitude]` world origin for the 3D scene |
| `babylon` | `boolean` | Use BabylonJS instead of ThreeJS |
| `defaultLight` | `boolean` | Add a default hemispheric/directional light |
| `onAdd` | `(scene, map, gl) => void` | Build the scene after the layer is added |
| `onRender` | `(gl, matrix) => void` | Runs on every render frame |
| `beforeId` | `string` | Insert before this layer id |
| `children` | any | Rendered once the scene exists (see `useScene()`) |

### Example

```jsx
<Layer3D
  babylon
  defaultLight
  origin={[148.9819, -35.39847]}
  onAdd={(scene) => loadModelInto(scene)}
/>
```

---

## Control

`src/components/Control/index.tsx`

Thin wrapper over `map.addControl`/`removeControl`. Resolves the concrete control class from
`window.MapLib` (`NavigationControl`, `ScaleControl`, `AttributionControl`, `GeolocateControl`,
`FullscreenControl`, `LogoControl`, `TerrainControl`) based on `type`, or uses `custom` if you
already have a control instance (e.g. `@mapbox/mapbox-gl-traffic`,
`@mapbox/mapbox-gl-language`). Re-adds the control whenever `type`/`options`/`custom` change, and
separately re-adds (without recreating) when only `position` changes.

### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `type`\* | `"navigation" \| "scale" \| "attribution" \| "fullscreen" \| "geolocate" \| "logo" \| "terrain"` | — | Which built-in control to add |
| `options` | control-specific options object | `{}` | Passed to the control's constructor |
| `custom` | control instance | — | Use a pre-built control instead of `type` (e.g. a `@mapbox/mapbox-gl-traffic` control) |
| `position` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `"top-right"` | Where the control is docked |

### Example

```jsx
<Control type="navigation" position="top-left" />
<Control type="fullscreen" position="top-right" />
```

---

## Image

`src/components/Image/index.tsx` — exported as `Image` (source name `MGL_Image`).

Wraps `map.addImage`/`updateImage`/`removeImage`, accepting a raw bitmap/`ImageData`, an
`SVGElement`, or a loadable URL (falls back to fetch + canvas rasterization for cross-origin SVGs
that `map.loadImage` can't handle directly). `options.fill`/`options.stroke`/`options.transform`
patch SVG attributes before loading. Alternatively, set `pattern` to procedurally generate one of
the built-in hatch/geometric patterns (`patternList`, e.g. `diagonal_l`, `cross`, `hex`, `circle`)
at runtime via a small canvas renderer — useful for dynamic fill colors without pre-baked image
assets. Re-adds the image automatically after a `style.load` event (base-style swaps wipe custom
images).

### Props

| Name | Type | Description |
| --- | --- | --- |
| `id`\* | `string` | ID used to reference the image from a layer's `icon-image`/`fill-pattern` |
| `source`\* | `HTMLImageElement \| ImageBitmap \| ImageData \| SVGElement \| {width,height,data} \| StyleImageInterface \| string` | Image data or a loadable URL (required unless `pattern` is set) |
| `options` | `StyleImageMetadata & { fill?: Color, stroke?: Color, transform?: string }` | Passed to `addImage`, plus SVG attribute overrides |
| `pattern` | `{ type: string, color: Color, background: Color, lineWith: number }` | Procedurally generate a pattern instead of using `source` |

### Example

```jsx
<Image id="cat" source="https://docs.mapbox.com/mapbox-gl-js/assets/cat.png" />
<Source source={{ type: "geojson", data: pointFeature }}>
  <Layer style={{ type: "symbol", layout: { "icon-image": "cat", "icon-size": 0.25 } }} />
</Source>
```

---

## Marker

`src/components/Marker/index.tsx`

Wraps `window.MapLib.Marker`, optionally paired with a `window.MapLib.Popup`. Uses `splitProps`
to separate props that force a full marker/popup recreation (`options`, `popup`) from ones that
just update the existing instance (`lngLat`, `children`, `showPopup`, `draggable`).

### Props

| Name | Type | Description |
| --- | --- | --- |
| `lngLat`\* | `LngLatLike` | Marker location |
| `options` | `MarkerOptions` | [Marker parameters](https://docs.mapbox.com/mapbox-gl-js/api/markers/#marker-parameters) |
| `popup` | `PopupOptions` | [Popup parameters](https://docs.mapbox.com/mapbox-gl-js/api/markers/#popup-parameters) for the attached popup |
| `showPopup` | `boolean` | Controls whether the attached popup is open |
| `draggable` | `boolean` | Whether the marker can be dragged |
| `onOpen` / `onClose` | `() => void` | Popup open/close callbacks |
| `onDragStart` / `onDragEnd` | `() => void` | Drag lifecycle callbacks |
| `onDrag` | `(lngLat: number[]) => void` | Called while dragging |
| `children` | `string \| HTMLElement` | Popup content (HTML string via `setHTML`, or a DOM node via `setDOMContent`) |

### Example

```jsx
<Marker lngLat={[0, 52]} options={{ color: "#F00" }}>
  Hi there! 👋
</Marker>
```

---

## Popup

`src/components/Popup/index.tsx`

Wraps `window.MapLib.Popup` directly on the map (no marker). Either `lngLat` or `trackPointer`
is required — with `trackPointer`, the popup follows the mouse cursor instead of sitting at a
fixed location.

### Props

| Name | Type | Description |
| --- | --- | --- |
| `lngLat`\* | `LngLatLike` | Popup location — required unless `trackPointer` is set |
| `trackPointer` | `boolean` | Track the popup to the mouse cursor instead of `lngLat` |
| `options` | `PopupOptions` | [Popup parameters](https://docs.mapbox.com/mapbox-gl-js/api/markers/#popup-parameters) |
| `onOpen` / `onClose` | `() => void` | Open/close callbacks |
| `children` | `string \| HTMLElement` | Popup content |

### Example

```jsx
<Popup lngLat={[0, 52]} options={{ closeButton: false }}>
  Hi there! 👋
</Popup>
```

---

## Terrain

`src/components/Terrain/index.tsx`

Wraps `map.setTerrain`. If no `Source` is nested (via `useSourceId()`) and no `source` prop is
given, automatically creates a hidden `raster-dem` source pointing at Mapbox's or MapLibre's
default terrain tiles (chosen via `ctx.map.isMapLibre`). Removes the terrain (`setTerrain(null)`)
on cleanup.

### Props

| Name | Type | Description |
| --- | --- | --- |
| `source` | `string` | Source id to use for elevation data; auto-created if omitted |
| `exaggeration` | `number` | [Terrain style spec](https://docs.mapbox.com/mapbox-gl-js/style-spec/terrain/) exaggeration factor (default `1`) |

### Example

```jsx
<Terrain exaggeration={2} />
```

Equivalent explicit form:

```jsx
<Source source={{ type: "raster-dem", url: "mapbox://mapbox.terrain-rgb", tileSize: 512, maxzoom: 14 }}>
  <Terrain exaggeration={2} />
</Source>
```

---

## Atmosphere

`src/components/Atmosphere/index.tsx`

Wraps `map.setFog`/`getFog`. All properties are optional; an empty `style` (or omitting the prop)
uses the current map style's default atmosphere.

### Props

| Name | Type | Description |
| --- | --- | --- |
| `style` | [`Fog`](https://docs.mapbox.com/mapbox-gl-js/style-spec/atmosphere) | Fog/atmosphere spec — `color`, `horizonBlend`, `intensity`, etc. |

### Example

```jsx
<Atmosphere style={{ color: "white", horizonBlend: 0.1, intensity: 0.5 }} />
```

---

## Light

`src/components/Light/index.tsx`

Wraps `map.setLight`/`setLight(null)`.

### Props

| Name | Type | Description |
| --- | --- | --- |
| `style` | [`Light`](https://docs.mapbox.com/mapbox-gl-js/style-spec/light) | Light spec — `anchor`, `color`, `intensity`, `position` |

### Example

```jsx
<Light style={{ anchor: "viewport", color: "white", intensity: 0.4 }} />
```

---

## Camera

`src/components/Camera/index.tsx`

Programmatic camera animation, independent of user-controlled `viewport`. Automatically pauses
while the user is interacting with the map (tracked via `mousedown`/`touchstart`/`wheel` vs.
`moveend`/`mouseup`/`touchend`) and resumes on `moveend`/`dragend`. Only one of `rotateGlobe` /
`rotateViewport` is typically used at a time. `translate` runs an independent
`requestAnimationFrame` loop that moves the free camera along a line (`lerp`) or great-circle arc
(`slerp`) between two `[x, y, z]` positions, looking at `target`.

### Props

| Name | Type | Description |
| --- | --- | --- |
| `rotateGlobe` | `boolean \| { secPerRev?, maxSpinZoom?, slowSpinZoom? }` | Auto-rotate the globe (slows down near `slowSpinZoom`, stops at `maxSpinZoom`) |
| `rotateViewport` | `boolean \| { secPerRev?, pitch?, around? }` | Auto-rotate the bearing around a center point |
| `reverse` | `boolean` | Reverse the rotation direction |
| `resetWhenStopped` | `boolean` | Ease back to the original center/north-up pitch when rotation is turned off |
| `translate` | `{ type?: "line" \| "sphere", start, end, target, targetEnd?, easing?, loop?, duration }` | Animate the free camera between two positions |
| `children` | any | Rendered as-is |

### Example

```jsx
<Camera rotateViewport />
```

---

## Draw

`src/components/Draw/index.tsx`

Wraps `@mapbox/mapbox-gl-draw` (or any API-compatible `lib`) as a Mapbox control. Merges in a set
of custom draw modes from `src/components/Draw/modes/` — `point`, `multi_point`, `line_string`,
`polygon`, `radius`, `rectangle`, `rectangle_assisted` — plus custom styling from
`drawingStyles.jsx` layered on top of the library's own theme. `showLength`/`showArea` turn on
live measurement labels computed with Turf.js (`modes/measurements.ts`: `getLength` uses
`@turf/length` + `@turf/midpoint`; `getArea` uses `@turf/area` + `@turf/center-of-mass`, both
formatted with `Intl.NumberFormat` and localized imperial/metric units based on
`navigator.language`). All `drawEvents` (`onCreate`, `onDelete`, `onUpdate`,
`onSelectionchange`, `onModechange`, ...) are wired to the underlying `draw.*` Mapbox GL Draw
events and cleaned up on unmount. `getInstance` gives you the raw draw control for imperative API
calls (`draw.add`, `draw.deleteAll`, etc.).

### Props

| Name | Type | Description |
| --- | --- | --- |
| `lib`\* | draw library module | e.g. `import MapboxDraw from "@mapbox/mapbox-gl-draw"` |
| `options` | object | [Draw options](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#options) |
| `position` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | Control position |
| `getInstance` | `(draw) => void` | Access to the draw instance for imperative [API methods](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#api-methods) |
| `showLength` | `boolean` | Show live length measurements while drawing lines |
| `showArea` | `boolean` | Show live area measurements while drawing polygons |
| `on[Event]` | see `drawEventTypes` in `src/events.ts` | `onCreate`, `onDelete`, `onCombine`, `onUncombine`, `onUpdate`, `onSelectionchange`, `onModechange`, `onRender`, `onActionable` |

### Example

```jsx
<Draw
  lib={MapboxDraw}
  options={{ controls: { combine_features: false, uncombine_features: false } }}
  onCreate={(event) => console.log(event)}
  getInstance={(draw) => draw.add({ type: "Point", coordinates: [0, 0] })}
/>
```

---

## Supporting modules

These aren't components but are shared by several of the ones above:

- **`src/events.ts`** — canonical lists of event names (`mapEvents`, `layerEvents`, `drawEvents`)
  and their prop-type shapes (`mapEventTypes`, `layerEventTypes`, `drawEventTypes`), consumed by
  `MapGL`, `Layer`, and `Draw` to wire `on[Event]` props to the underlying Mapbox events.
- **`src/styles.ts`** — `baseStyle` (top-level layer-spec keys like `id`, `type`, `filter`,
  `source`, `minzoom`/`maxzoom`) and `layoutStyles` (the full list of Mapbox `layout` property
  names), used by `Layer` to bucket a flat style object into `paint`/`layout`.
- **`src/mapStyles.ts`** — `vectorStyleList` (`mb:*` Mapbox styles, `here:*`, `esri:*`) and
  `rasterStyleList` (`osm:*`, `carto:*`, `stamen:*`, `tf:*` raster tile templates with `{s}`/`{r}`/
  `{apikey}` placeholders), used by `MapGL` and `Source` to resolve basemap shorthand strings.
  Full list of shortcuts documented in `docs/styles.md`.
