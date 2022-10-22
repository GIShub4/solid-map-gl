---
description: Atmosphere Layer Component
---

# Atmosphere

## Props

| Name  | Type   | Description                                                             |
| ----- | ------ | ----------------------------------------------------------------------- |
| style | object | [Fog style specs](https://docs.mapbox.com/mapbox-gl-js/style-spec/fog/) |

_\*required_

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Atmosphere } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [0, 52],
    zoom: 6,
    pitch: 100
  } as Viewport);

  return (
    <MapGL
      options={{ style: 'mb:sat_street' }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Atmosphere />
    </MapGL>
  );
};
```
