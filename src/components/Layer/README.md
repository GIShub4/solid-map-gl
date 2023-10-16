---
description: Layer Component
---

# Layer

## Props

<table><thead><tr><th width="149.33333333333331">Name</th><th width="201">Type</th><th>Description</th></tr></thead><tbody><tr><td>id</td><td>string</td><td>only required if referrenced outside of nested layer</td></tr><tr><td>style</td><td>object</td><td><a href="https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/">Layer Style Object</a></td></tr><tr><td>customLayer</td><td><a href="https://docs.mapbox.com/mapbox-gl-js/api/properties/#customlayerinterface">CustomLayerInterface</a></td><td>To include external layers e.g. <a href="https://deck.gl/">deck.gl</a></td></tr><tr><td>filter</td><td><a href="https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/">FilterSpecification</a></td><td>Filter expression</td></tr><tr><td>visible</td><td>boolean</td><td>Show/Hide Layer</td></tr><tr><td>sourceId</td><td>string</td><td>Required for Vector Sources</td></tr><tr><td>beforeType</td><td>string</td><td>background | fill | line | symbol | raster | circle | fill-extrusion | heatmap | hillshade | sky</td></tr><tr><td>beforeId</td><td>string</td><td>Id of Layer to insert Layer before</td></tr><tr><td>featureState</td><td>object</td><td>Define Feature State</td></tr></tbody></table>

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
