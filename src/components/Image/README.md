---
description: Image Component
---

# Image

## Props

| Name    | Type                                                                           | Description                                                                       |
| ------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| id\*    | string                                                                         | Id to reference image in layer style                                              |
| url     | string                                                                         | [Loadable Image URL](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#loadimage) |
| image   | [HTMLImageElement](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addimage) | ImageBitmap                                                                       |
| options | object                                                                         | [Add image options](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addimage)   |

_\*required_

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Image, Layer } from "solid-map-gl";

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
      <Image
        id="cat"
        url="https://docs.mapbox.com/mapbox-gl-js/assets/cat.png"
      />
      <Source
        source={{
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [-77.4144, 25.0759],
                },
              },
            ],
          },
        }}
      >
        <Layer
          style={{
            type: "point",
            layout: {
              "icon-image": "cat",
              "icon-size": 0.25,
            },
          }}
        />
      </Source>
    </MapGL>
  );
};
```
