---
description: Image Component
---

# Image

## Props

| Name     | Type                                                                                                                         | Description                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| id\*     | string                                                                                                                       | ID to reference image in layer style                                                                        |
| source\* | [HTMLImageElement, SVGElement, ImageBitmap, ImageData](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addimage) \| string | ImageBitmap or [Loadable Image URL](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#loadimage)            |
| options  | object or { stroke \| fill \| transform }                                                                                    | [Add image options](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addimage) or overwrite SVG properties |

_\*required_

## SVG sources

When `source` is raw SVG markup (a string starting with `<svg`), mapbox-gl's own image loader
always rejects it — it treats any string as a request URL, and markup isn't a valid one — so
`<Image>` falls back to rasterizing it locally onto a `<canvas>` instead. That fallback has a
couple of requirements to get a sharp, correctly-proportioned result:

- Give the SVG explicit, matching `width`/`height` (and a `viewBox`). Without them, the browser
  falls back to a 300×150 default intrinsic size, and the fallback rasterizes at that oversized,
  non-square size instead of your intended icon.
- Design it at its intended aspect ratio. The source is scaled *uniformly* — never stretched — up
  to a minimum of 50px on its smaller axis, so a non-square SVG keeps its proportions rather than
  being squashed into a square.
- Author at 50px or larger per axis. Anything smaller is upscaled to that 50px floor anyway, so
  there's no sharpness benefit to going smaller.
- Rasterization is retina-aware by default: it oversamples by `window.devicePixelRatio` and tags
  the result with a matching `pixelRatio`, so the icon's on-map footprint (its CSS-pixel size at
  `icon-size: 1`) stays the same as an un-oversampled render would have been — just sharper on
  high-DPI screens. Pass `options={{ pixelRatio: N }}` yourself to pin a specific ratio instead of
  matching the current screen.

This only applies to raw SVG markup sources. A `source` that's already an `HTMLImageElement`,
`ImageBitmap`, `ImageData`, or a loadable raster URL (e.g. a `.png`) skips this fallback entirely
and is added as-is — size and `pixelRatio` for those are entirely up to what you provide.

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
        source="https://docs.mapbox.com/mapbox-gl-js/assets/cat.png"
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
