---
description: Marker Component
---

# Marker

## Props

| Prop     | Type                                                                               | Description                                                                              |
| -------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| options  | object                                                                             | [Marker Parameters](https://docs.mapbox.com/mapbox-gl-js/api/markers/#marker-parameters) |
| lngLat\* | [LngLatLike](https://docs.mapbox.com/mapbox-gl-js/api/geography/#lnglatlike)       | Marker Location                                                                          |
| children | [HTML Element \| String](https://developer.mozilla.org/en-US/docs/Web/API/Element) | Marker Popup Content                                                                     |

_\*required_

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Marker } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [0, 52],
    zoom: 6,
  } as Viewport);

  return (
    <MapGL
      options={{ style: 'mb:dark' }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Marker lngLat={[0, 52]} options={{ color: '#F00' }}>
        Hi there! 👋
      </Marker>
    </MapGL>
  );
};
```
