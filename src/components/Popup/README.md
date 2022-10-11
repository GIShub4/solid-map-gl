---
description: Popup Component
---

# Popup

## Props

| Name         | Type                                                                               | Default   | Description                                                                            |
| ------------ | ---------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------- |
| options      | object                                                                             | {}        | [Popup Parameters](https://docs.mapbox.com/mapbox-gl-js/api/markers/#popup-parameters) |
| lngLat\*     | [LngLatLike](https://docs.mapbox.com/mapbox-gl-js/api/geography/#lnglatlike)       | null      | Popup Location (required if trackPointer is false)                                     |
| trackPointer | boolean                                                                            | false     | Track Popup to mouse cursor                                                            |
| children     | [HTML Element \| String](https://developer.mozilla.org/en-US/docs/Web/API/Element) | undefined | Popup Content                                                                          |
| onClose      | function                                                                           | null      | Called when popup closes                                                               |

_\*required_

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Popup } from "solid-map-gl";
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
      <Popup lngLat={[0, 52]} options={{ closeButton: false }}>
        Hi there! 👋
      </Popup>
    </MapGL>
  );
};
```
