---
description: Light Layer Component
---

# Light

## Props

| Name  | Type   | Description                                                                |
| ----- | ------ | -------------------------------------------------------------------------- |
| style | object | [Light style specs](https://docs.mapbox.com/mapbox-gl-js/style-spec/light) |

_\*required_\
_^default_

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Light } from "solid-map-gl";
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
      <Light style={{
        anchor: 'viewport',
        color: 'white',
        intensity: 0.4
      }}/>
    </MapGL>
  );
};
```
