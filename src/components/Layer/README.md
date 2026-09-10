---
description: Layer Component
---

# Layer

## Props

| Name         | Type                                                                                              | Description                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| id           | string                                                                                            | only required if referenced outside of nested layer                                                       |
| style        | object                                                                                            | [Layer Style Object](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/) — any paint/layout value also accepts `'@name'` to reuse a value from `<MapGL>`'s `constants` prop; a `*-color` paint property additionally accepts a [Tailwind CSS v4](https://tailwindcss.com/docs/colors) color name (e.g. `'blue-600'`, resolved from the page's live `--color-blue-600` variable), a raw CSS Color 4 value (e.g. `'oklch(54.6% 0.245 262.881)'`) that Mapbox itself can't parse, or `'bg-{name} dark:bg-{name}'` (e.g. `'bg-blue-600 dark:bg-blue-400'`) to pick whichever the browser's cascade resolves for the real, compiled Tailwind classes — automatically tracking the page's dark mode |
| customLayer  | [CustomLayerInterface](https://docs.mapbox.com/mapbox-gl-js/api/properties/#customlayerinterface) | To include external layers e.g. [deck.gl](https://deck.gl/)                                               |
| filter       | [FilterSpecification](https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/)               | Filter expression                                                                                         |
| visible      | boolean                                                                                           | Show/Hide Layer                                                                                           |
| sourceId     | string                                                                                            | Required for Vector Sources                                                                               |
| beforeType   | string                                                                                            | background \| fill \| line \| symbol \| raster \| circle \| fill-extrusion \| heatmap \| hillshade \| sky |
| beforeId     | string                                                                                            | Id of Layer to insert Layer before                                                                        |
| featureState | object                                                                                            | Define Feature State                                                                                      |

_\*required_

## Examples

### Circle Layer

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = (props) => {
  const [viewport, setViewport] = createSignal({
    center: [-122.45, 37.78],
    zoom: 6,
  } as Viewport);

  return (
    <MapGL
      options={{ style: 'mb:light' }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Source
        source={{
          type: 'geojson',
          data: 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson',
        }}
      >
        <Layer
          style={{
            type: 'circle',
            paint: {
              'circle-radius': 5,
              'circle-color': 'red',
            },
          }}
        />
      </Source>
    </MapGL>
  );
};
```

### Reusing a color across layers

Define a value once on `<MapGL>`'s `constants` prop, then reference it by name (`'@name'`) in any
number of `<Layer>` style props — updating `constants` re-applies it everywhere it's used.

```jsx
<MapGL options={{ style: 'mb:light' }} constants={{ primary: '#e0492b', roadWidth: 2 }}>
  <Source source={{ type: 'geojson', data: '...' }}>
    <Layer style={{ type: 'fill', paint: { 'fill-color': '@primary' } }} />
    <Layer style={{ type: 'line', paint: { 'line-color': '@primary', 'line-width': '@roadWidth' } }} />
  </Source>
</MapGL>
```

### Automatic light/dark colors

`'bg-{name} dark:bg-{name}'` picks whichever color the browser's own cascade resolves for those
*real*, compiled Tailwind utility classes — so it respects whatever dark-mode strategy your
Tailwind config actually uses (a class or attribute on any ancestor, a media query, ...) rather
than `solid-map-gl` guessing. This needs the full `bg-`-prefixed class names to appear literally in
your own source (not just the bare color name) so Tailwind's build actually generates them.

```jsx
<Layer style={{ type: 'fill', paint: { 'fill-color': 'bg-blue-600 dark:bg-blue-400' } }} />
```
