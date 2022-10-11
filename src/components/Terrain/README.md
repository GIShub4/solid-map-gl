---
description: Terrain Layer Component
---

# Terrain

## Props

| Name         | Type    | Default | Description                                                                     |
| ------------ | ------- | ------- | ------------------------------------------------------------------------------- |
| exaggeration | number  | 1       | [Terrain style specs](https://docs.mapbox.com/mapbox-gl-js/style-spec/terrain/) |
| visible      | boolean | true    | Show / Hide Layer                                                               |

_\*required_

## Example

If no source is defined then the default Mapbox / MapLibre DEM will be used. Both examples give the same result.

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Terrain } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [138.74, 35.3],
    zoom: 11,
    pitch: 70,
  } as Viewport);

  return (
    <MapGL
      options={{ style: 'mb:sat' }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Terrain exaggeration={2} />
    </MapGL>
  );
};
```

### OR

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Terrain } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [138.74, 35.3],
    zoom: 11,
    pitch: 70,
  } as Viewport);

  return (
    <MapGL
      options={{ style: 'mb:sat' }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Source
        source={{
          type: 'raster-dem',
          url: 'mapbox://mapbox.terrain-rgb',
          tileSize: 512,
          maxzoom: 14,
        }}
      >
        <Terrain exaggeration={2} />
      </Source>
    </MapGL>
  );
};
```
