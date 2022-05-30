---
description: Terrain Layer Component
---

# Terrain

## Props

| Name    | Type    | Description                                                                     |
| ------- | ------- | ------------------------------------------------------------------------------- |
| style\* | object  | [Terrain style specs](https://docs.mapbox.com/mapbox-gl-js/style-spec/terrain/) |
| visible | boolean | Show / Hide Layer                                                               |

_\*required_

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Terrain } from "solid-map-gl";

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
      <Source
        source={{
          type: "raster-dem",
          url: "mapbox://mapbox.terrain-rgb",
          tileSize: 512,
          maxzoom: 14,
        }}
      >
        <Terrain style={{ exaggeration: 2 }} />
      </Source>
    </MapGL>
  );
};
```
