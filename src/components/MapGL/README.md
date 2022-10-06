# Map

## Props

| Name             | Type      | Description                                                                                  |
| ---------------- | --------- | -------------------------------------------------------------------------------------------- |
| mapLib       | module   | Pass [MapLibre](https://maplibre.org/) package to use replace Mapbox library                      |
| style            | string    | CSS style for map container                                                                  |
| class            | string    | CSS class for map container                                                                  |
| classList        | string\[] | SolidJS classList attached to map container                                                  |
| viewport         | object    | Current viewport of the map, contains: `latitude, longitude, zoom, ...`                      |
| onViewportChange | Viewport     | Set the map viewport                                                                         |
| options          | object    | [Mapbox map parameter](https://docs.mapbox.com/mapbox-gl-js/api/map/#map-parameters)         |
| transitionType   | string    | flyTo^, easeTo, jumpTo                                                                       |
| on\[Event]       | Event     | Any [Map Event](https://docs.mapbox.com/mapbox-gl-js/api/map/#map-events) - eg.: onMouseMove |
| cursorStyle      | string    | Map cursor                                                                                   |
| darkStyle        | object \| string    | Map style when application or browser is in dark mode                              |
| debug            | boolean    | Enable debug messages                                                                       |

_\*required_\
_^default_

## Examples

### Static Map

By default, `MapGL` component renders in a static mode. That means that the user cannot interact with the map.

```jsx
import { Component } from "solid-js";
import MapGL from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = () => (
  <MapGL
    options={{ style: 'mb:basic' }}
    viewport={{
      center: [-122.41, 37.78],
      zoom: 11,
    }}
  ></MapGL>
);
```

### **Interactive Map**

In most cases, you will want the user to interact with the map. To do this, you need to provide `onViewportChange` handler, that will update the map's viewport state.

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.41, 37.78],
    zoom: 11,
  } as Viewport);

  return (
    <MapGL
      options={{ style: 'mb:light' }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    ></MapGL>
  );
};
```

### **Changing Map Style**

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.45, 37.78],
    zoom: 11,
  } as Viewport);
  const [style, setStyle] = createSignal('basic');

  return (
    <MapGL
      options={{ style: `mb:${style()}` }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <button onClick={() => setStyle('dark')}>Dark</button>
      <button onClick={() => setStyle('light')}>Light</button>
      <button onClick={() => setStyle('streets')}>Street</button>
      <button onClick={() => setStyle('outdoors')}>Outdoor</button>
      <button onClick={() => setStyle('sat')}>Satellite</button>
      <button onClick={() => setStyle('sat-streets')}>Satellite Streets</button>
      <button onClick={() => setStyle('nav-day')}>Nav Day</button>
      <button onClick={() => setStyle('nav-night')}>Nav Night</button>
    </MapGL>
  );
};
```
