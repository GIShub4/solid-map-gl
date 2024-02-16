---
description: Represents the map's camera
---

# Camera

## Props

| Name             | Type              | Description                             |
| ---------------- | ----------------- | --------------------------------------- |
| rotateGlobe      | object \| boolean | rotate map when in globe view           |
| rotateViewport   | object \| boolean | rotate map around center                |
| reverse          | boolean           | reverses the rotation direction         |
| resetWhenStopped | boolean           | returns to origin when rotation stopped |
| translate        | object            | translate viewport in 3D space          |

_\*required_\
_^default_

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Camera } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [0, 52],
    zoom: 6,
  } as Viewport);

  return (
    <MapGL
      options={{ style: 'mb:sat_street' }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Camera rotateViewport />
    </MapGL>
  );
};
```
