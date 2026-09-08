---
description: Draw Component
---

# Draw

## Props

| Name        | Type     | Description                                                                                                                |
| ----------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| lib\*       | object   | Draw Library from `import`                                                                                                 |
| options     | object   | [Draw Options](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#options)                                     |
| position    | string   | 'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'                                                               |
| getInstance | function | access to the Draw Object to run [API Methods](https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#api-methods) |
| showLength  | boolean  | Show a live length label while drawing lines/rectangles                                                                    |
| showArea    | boolean  | Show a live area label while drawing polygons/rectangles                                                                   |
| on[Event]   | function | Called when event is fired at draw control                                                                                 |

_\* required_

## Extra draw modes

Alongside `showLength`/`showArea`, `Draw` registers a few extra modes on top of `lib`'s defaults
that aren't part of `@mapbox/mapbox-gl-draw` itself:

- `multi_point` — place several points in a row without leaving draw mode after each click.
- `radius` — draw a point with a `radius` property (in meters) by dragging out from a center point.
- `rectangle` / `rectangle_assisted` — draw an axis-aligned or angle-assisted rectangle.

Activate them with `draw.changeMode(...)`, e.g. `getInstance={(draw) => draw.changeMode("radius")}`.

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
        getInstance={draw => draw.add({ type: 'Point', coordinates: [0, 0] })}
      />
    </MapGL>
  );
};
```
