---
description: Add a deck.gl overlay on top of the map for both Mapbox and MapLibre.
---

# DeckOverlay

The DeckOverlay component adds a [deck.gl](https://deck.gl/) overlay as a map control. It works
with either base library, but `solid-map-gl` never imports `@deck.gl/*` itself — you supply the
overlay class yourself, matching whichever library `MapGL` is using.

## Props

| Name      | Type                       | Description                                                                 | Default Value |
| --------- | -------------------------- | ---------------------------------------------------------------------------- | -------------- |
| overlay\* | class                      | The deck.gl overlay class: `MapboxOverlay` from `@deck.gl/mapbox` for Mapbox, `MapLibreOverlay` from `@deck.gl/maplibre` for MapLibre. Pass the class, not an instance. | —             |
| props     | object                     | Props forwarded to the overlay, e.g. `{ layers, interleaved }` — updated reactively via the overlay's own `setProps`. | `{}`          |

_\* indicates a required property._

#### Picking the right package

`@deck.gl/mapbox`'s `MapboxOverlay` and `@deck.gl/maplibre`'s `MapLibreOverlay` are separate
packages, not one class that covers both — this is deck.gl's own solution to the same
Mapbox/MapLibre divergence problem this library solves with `ctx.isMapLibre`. Import whichever one
matches your `<MapGL mapLib={...}>` setup:

```jsx
import { useMapContext } from "solid-map-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { MapLibreOverlay } from "@deck.gl/maplibre";

const [ctx] = useMapContext();
const Overlay = ctx.isMapLibre ? MapLibreOverlay : MapboxOverlay;
```

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, DeckOverlay } from "solid-map-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer } from "@deck.gl/layers";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [0, 52],
    zoom: 6,
  } as Viewport);

  return (
    <MapGL
      options={{ style: 'mb:light' }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <DeckOverlay
        overlay={MapboxOverlay}
        props={{
          layers: [
            new ScatterplotLayer({
              data: [{ coordinates: [0, 52] }],
              getPosition: (d) => d.coordinates,
              getRadius: 1000,
              getFillColor: [255, 0, 0],
            }),
          ],
        }}
      />
    </MapGL>
  );
};
```
