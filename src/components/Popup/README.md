---
description: Popup Component
---

# Popup

## Props

| Name     | Type                                                                               | Description                                                                            |
| -------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| options  | object                                                                             | [Popup Parameters](https://docs.mapbox.com/mapbox-gl-js/api/markers/#popup-parameters) |
| lngLat\* | [LngLatLike](https://docs.mapbox.com/mapbox-gl-js/api/geography/#lnglatlike)       | Popup Location                                                                         |
| children | [HTML Element \| String](https://developer.mozilla.org/en-US/docs/Web/API/Element) | Popup Content                                                                          |

_\*required_

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Popup } from "solid-map-gl";

const Map: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [0, 0],
    zoom: 6,
  } as Viewport);

  return (
    <MapGL
      options={{
        accessToken: MAPBOX_ACCESS_TOKEN,
        style: "mb:light",
      }}
      viewport={viewport()}
      onViewportChange={(evt: Event) => setViewport(evt)}
    >
      <Popup lngLat={[0, 0]} options={{ closeButton: false }}>
        Hi there! 👋
      </Popup>
    </MapGL>
  );
};
```
