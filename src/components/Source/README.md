---
description: Source Component
---

# Source

## Props

| Name     | Type   | Description                                                                    |
| -------- | ------ | ------------------------------------------------------------------------------ |
| id       | string | required if `Layer` components are not nested                                  |
| source\* | object | [Source style specs](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/) |

_\*required_

## Examples

### GeoJSON URL Source

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.45, 37.78],
    zoom: 11,
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
          type: "geojson",
          data: "https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson",
        }}
      >
        <Layer
          style={{
            type: "circle",
            source: "earthquakes",
            paint: {
              "circle-radius": 8,
              "circle-color": "red",
            },
          }}
        />
      </Source>
    </MapGL>
  );
};
```

### GeoJSON Source

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.486052, 37.830348],
    zoom: 15,
  } as Viewport);

  const data = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: [
        [-122.48369693756104, 37.83381888486939],
        [-122.48348236083984, 37.83317489144141],
        [-122.48339653015138, 37.83270036637107],
        [-122.48356819152832, 37.832056363179625],
        [-122.48404026031496, 37.83114119107971],
        [-122.48404026031496, 37.83049717427869],
        [-122.48348236083984, 37.829920943955045],
        [-122.48356819152832, 37.82954808664175],
        [-122.48507022857666, 37.82944639795659],
        [-122.48610019683838, 37.82880236636284],
        [-122.48695850372314, 37.82931081282506],
        [-122.48700141906738, 37.83080223556934],
        [-122.48751640319824, 37.83168351665737],
        [-122.48803138732912, 37.832158048267786],
        [-122.48888969421387, 37.83297152392784],
        [-122.48987674713133, 37.83263257682617],
        [-122.49043464660643, 37.832937629287755],
        [-122.49125003814696, 37.832429207817725],
        [-122.49163627624512, 37.832564787218985],
        [-122.49223709106445, 37.83337825839438],
        [-122.49378204345702, 37.83368330777276],
      ],
    },
  };

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
          type: "geojson",
          data: { data },
        }}
      >
        <Layer
          style={{
            type: "line",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#888",
              "line-width": 8,
            },
          }}
        />
      </Source>
    </MapGL>
  );
};
```

### Vector Source

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.447303, 37.753574],
    zoom: 13,
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
          type: "vector",
          url: "mapbox://mapbox.mapbox-terrain-v2",
        }}
      >
        <Layer
          style={{
            "source-layer": "contour",
            type: "line",
            paint: {
              "line-width": 2,
              "line-color": "hsla(200, 50%, 50%, 0.5)",
            },
          }}
        />
      </Source>
    </MapGL>
  );
};
```
