---
description: Image Component
---

# Image

## Props

| Name    | Type                                                                                     | Description                                                                                      |
| ------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| id\*    | string                                                                                   | ID to reference image in layer style                                                             |
| image\* | [HTMLImageElement](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addimage) \| string | ImageBitmap or [Loadable Image URL](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#loadimage) |
| options | object                                                                                   | [Add image options](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addimage)                  |

_\*required_

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Image, Layer } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

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
      <Image
        id="cat"
        image="https://docs.mapbox.com/mapbox-gl-js/assets/cat.png"
      />
      <Source
        source={{
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [-77.4144, 25.0759],
                },
              },
            ],
          },
        }}
      >
        <Layer
          style={{
            type: 'symbol',
            layout: {
              'icon-image': 'cat',
              'icon-size': 0.25,
            },
          }}
        />
      </Source>
    </MapGL>
  );
};
```
