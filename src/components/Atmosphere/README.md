---
description: Atmosphere Layer Component
---

# Atmosphere

## Props

| Name    | Type    | Default | Description                                                             |
| ------- | ------- | ------- | --------------------------------------------------------------- |
| style | object  | {} | [Fog style specs](https://docs.mapbox.com/mapbox-gl-js/style-spec/fog/) |
| visible | boolean | true | Show / Hide Layer                                                       |

_\*required_

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Atmosphere } from "solid-map-gl";

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
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Atmosphere />
    </MapGL>
  );
};
```
