# Map

## Props

| Name              | Type                            | Description                                                                                  |
| ----------------- | ------------------------------- | -------------------------------------------------------------------------------------------- |
| mapLib            | module                          | Pass [MapLibre](https://maplibre.org/) package to use instead of Mapbox library — also import `maplibre-gl/dist/maplibre-gl.css` instead of Mapbox's CSS, see below |
| style             | string                          | CSS style for map container                                                                  |
| class             | string                          | CSS class for map container                                                                  |
| classList         | string\[]                       | SolidJS classList attached to map container                                                  |
| viewport          | object                          | Current viewport of the map, contains: `latitude, longitude, zoom, ...`                      |
| onViewportChange  | Viewport                        | Set the map viewport                                                                         |
| options           | object                          | [Mapbox map parameter](https://docs.mapbox.com/mapbox-gl-js/api/map/#map-parameters)         |
| config            | object | Sets configuration in Mapbox Standard/Standard Satellite Style (`lightPreset`, `showPlaceLabels`, `theme`, `color*` overrides, ...). Mapbox-only — silently ignored (with a debug log) on MapLibre, which has no equivalent | 
| transitionType    | string                          | flyTo^, easeTo, jumpTo                                                                       |
| on\[Event]        | Event                           | Any [Map Event](https://docs.mapbox.com/mapbox-gl-js/api/map/#map-events) - eg.: onMouseMove |
| onUserInteraction | boolean                         | Event Listeners for user interactions with the map                                           |
| onTilesLoaded     | `() => void`                    | Fires after `idle`, once every tile has actually finished loading *and* rendering (polls `map.areTilesLoaded()`, confirms a real paint, then waits out any raster-fade cross-fade) — unlike `onIdle`, not fooled by tiles still fetching, mid GPU-upload, or fading in |
| tilesLoadedTimeout | number                          | Max ms to keep polling `areTilesLoaded()` before giving up and moving on anyway (default `10000`) |
| tilesLoadedFadeMargin | number                       | Extra flat delay (ms) to outlast a `raster-fade-duration` cross-fade still in flight (default `400`; set to `0` to disable) |
| offscreen         | `{ width, height, disableRasterFade? }` | Renders the map off-screen (fixed, far outside the viewport) instead of filling its container — for capturing map images without showing them. `<Source>`/`<Layer>` children work unchanged |
| onCapturerReady   | `(capturer) => void`            | Called once, after load, when `offscreen` is set. `capturer.captureWhenSettled()` waits for the map to fully settle and returns a canvas data URL, ready for any PDF/document library |
| onError           | `(error: Error) => void`        | Called if map initialization fails (unsupported environment, or the underlying map constructor throws). Always logged via `console.error` too, so nothing is silently lost if this isn't given |
| cursorStyle       | string                          | Map cursor                                                                                   |
| darkStyle         | object \| string                | Map style when application or browser is in dark mode                                        |
| disableResize     | boolean                         | disable listener for resizing map container                                                  |
| debug             | boolean                         | Enable debug messages                                                                        |
| apikey            | string                          | apikey for vectortile services                                                               |
| constants         | `Record<string, string \| number>` | Named values reusable across every `<Layer>` — write `'@name'` in a paint/layout style property instead of the literal value |

_\*required_\
_^default_

## Examples

### Static Map

By default, `MapGL` component renders in a static mode. That means that the user cannot interact with the map.

```jsx
import { Component } from 'solid-js'
import MapGL from 'solid-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const App: Component = () => (
  <MapGL
    options={{ style: 'mb:basic' }}
    viewport={{
      center: [-122.41, 37.78],
      zoom: 11,
    }}
  ></MapGL>
)
```

### **Interactive Map**

In most cases, you will want the user to interact with the map. To do this, you need to provide `onViewportChange` handler, that will update the map's viewport state.

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = () => {
  const [viewport, setViewport] = createSignal<Viewport>({
    center: [-122.41, 37.78],
    zoom: 11,
  });

  return (
    <MapGL
      options={{ style: 'mb:light' }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    ></MapGL>
  );
};
```

### **Using MapLibre**

`solid-map-gl` doesn't load a base map stylesheet for you — import the one matching whichever library you pass via `mapLib`. Importing the wrong CSS (e.g. Mapbox's, while using MapLibre) leaves the map broken (no size, misplaced controls).

```jsx
import { Component } from 'solid-js'
import MapGL from 'solid-map-gl'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const App: Component = () => (
  <MapGL
    mapLib={maplibregl}
    options={{ style: 'https://demotiles.maplibre.org/style.json' }}
    viewport={{
      center: [-122.41, 37.78],
      zoom: 11,
    }}
  ></MapGL>
)
```

### **Changing Map Style**

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = () => {
  const [viewport, setViewport] = createSignal<Viewport>({
    center: [-122.45, 37.78],
    zoom: 11,
  });
  const [style, setStyle] = createSignal('basic');

  return (
    <MapGL
      options={{ style: `mb:${style()}` }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <button onClick={() => setStyle('dark')}>Dark</button>
      <button onClick={() => setStyle('light')}>Light</button>
      <button onClick={() => setStyle('street')}>Street</button>
      <button onClick={() => setStyle('outdoors')}>Outdoor</button>
      <button onClick={() => setStyle('sat')}>Satellite</button>
      <button onClick={() => setStyle('sat_street')}>Satellite Streets</button>
      <button onClick={() => setStyle('nav_day')}>Nav Day</button>
      <button onClick={() => setStyle('nav_night')}>Nav Night</button>
    </MapGL>
  );
};
```

### **Off-screen Capture (e.g. for PDF export)**

`offscreen` renders the map fixed and far outside the viewport instead of filling its container —
`<Source>`/`<Layer>` children work exactly as they do on a normal `<MapGL>`, since they only ever
read the map off context, never the DOM it's rendered into. `onCapturerReady`'s `captureWhenSettled()`
waits for the map to fully settle (see `onTilesLoaded`) before returning a canvas data URL, ready
for any PDF/document library.

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Source, Layer, Viewport } from "solid-map-gl";
import type { MapCapturer } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = () => {
  const [viewport, setViewport] = createSignal<Viewport>({ center: [-122.45, 37.78], zoom: 14 });
  let capturer: MapCapturer;

  const captureLocation = async (center: [number, number]) => {
    setViewport({ ...viewport(), center });
    const dataUrl = await capturer.captureWhenSettled();
    // hand dataUrl to pdfmake/jsPDF/whichever document library you're already using
    return dataUrl;
  };

  return (
    <MapGL
      offscreen={{ width: 640, height: 480 }}
      options={{ style: "mapbox://styles/mapbox/standard-satellite" }}
      viewport={viewport()}
      onCapturerReady={(c) => (capturer = c)}
    >
      <Source id="pin" type="geojson" data={{ type: "FeatureCollection", features: [] }}>
        <Layer type="circle" paint={{ circleColor: "#f00", circleRadius: 8 }} />
      </Source>
    </MapGL>
  );
};
```
