---
description: Draw Component
---

# Draw

## Props

| Name    | Type                                                                                     | Description                                                                                      |
| ------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| lib\*    | object | Draw Library from `import` |
| options | object | [Draw Options](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#options) |
| position| string | 'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right' |
| getInstance | function | access to the Draw Object to run [API Methods](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#api-methods)
| on[Event] | function | Called when event is fired at draw control


_\*required_

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Image, Layer } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-77.4144, 25.0759],
    zoom: 6,
  } as Viewport);

  return (
    <MapGL
      options={{ style: 'mb:light' }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Draw
        lib={MapboxDraw}
        options={{
          controls: {
            combine_features: false,
            uncombine_features: false,
          }
        }}
        onCreate={event => console.log(event)}
        getControl={draw => draw.add({ type: 'Point', coordinates: [0, 0] })}
      />
    </MapGL>
  );
};
```
