![Banner](https://assets.solidjs.com/banner?project=solid-map-gl&background=tiles&type=Mapping%20Plugin)

# ***Solid Map GL*** for Mapbox & MapLibre

[![npm](https://img.shields.io/npm/v/solid-map-gl)](https://www.npmjs.com/package/solid-map-gl)
[![downloads](https://img.shields.io/npm/dt/solid-map-gl)](https://www.npmjs.com/package/solid-map-gl)
[![licence](https://img.shields.io/npm/l/solid-map-gl?color=blue)](LICENSE/)
[![size](https://img.shields.io/bundlephobia/min/solid-map-gl)](https://bundlephobia.com/package/solid-map-gl)
[![treeshaking](https://img.shields.io/badge/treeshaking-supported-success)](https://bundlephobia.com/package/solid-map-gl) 
![ts](https://img.shields.io/badge/types-included-blue?logo=typescript&logoColor=white)

[SolidJS](https://www.solidjs.com/) Component Library for [Mapbox GL JS](https://github.com/mapbox/mapbox-gl-js) and [MapLibre GL.](https://maplibre.org/projects/maplibre-gl-js/) Both libraries render interactive maps from vector tiles and Map styles using WebGL. This project is intended to be as close as possible to the [Mapbox GL JS API.](https://docs.mapbox.com/mapbox-gl-js/api/)

### [Documentation & Examples](https://gis-hub.gitbook.io/solid-map-gl)
[![Gallery](/docs/header.png)](https://gis-hub.gitbook.io/solid-map-gl)

## Installation


```shell
pnpm add solid-map-gl
# or
yarn add solid-map-gl
# or
npm i solid-map-gl
```

## Components

| Component                            | Description                                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| [MapGL](https://gis-hub.gitbook.io/solid-map-gl/components/mapgl)       | Represents map on the page                                                                                             |
| [Source](https://gis-hub.gitbook.io/solid-map-gl/components/source)     | [Sources](https://docs.mapbox.com/mapbox-gl-js/api/#sources) specify the geographic features to be rendered on the map |
| [Layer](https://gis-hub.gitbook.io/solid-map-gl/components/layer)       | [Layers](https://docs.mapbox.com/mapbox-gl-js/style-spec/#layers) specify the `Sources` style                          |                                                                                                 |
| [Atmosphere](https://gis-hub.gitbook.io/solid-map-gl/components/atmosphere)           | Specify the Atmosphere                                                                                                  |
| [Terrain](https://gis-hub.gitbook.io/solid-map-gl/components/terrain)   | Specify the Terrain                                                                                              |
| [Image](https://gis-hub.gitbook.io/solid-map-gl/components/image)       | Adds an image to the map style                                                                                         |
| [Popup](https://gis-hub.gitbook.io/solid-map-gl/components/popup)       | Component for [Mapbox GL JS Popup](https://docs.mapbox.com/mapbox-gl-js/api/#popup)                                    |
| [Marker](https://gis-hub.gitbook.io/solid-map-gl/components/marker)     | Component for [Mapbox GL JS Marker](https://docs.mapbox.com/mapbox-gl-js/api/#marker)                                  |
| [Control](https://gis-hub.gitbook.io/solid-map-gl/components/control) | Represents the map's control                                                                                           |

## Usage with [Mapbox](https://docs.mapbox.com/mapbox-gl-js/guides/)


```jsx
import { render } from "solid-js/web";
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
      onViewportChange={(evt: Viewport) => setViewport(evt)}
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

render(() => <App />, document.getElementById("app")!);
```
## Usage with [MapLibre](https://maplibre.org/maplibre-gl-js-docs/api/)


```jsx
import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.45, 37.78],
    zoom: 11,
  } as Viewport);

  return (
    <MapGL
      asMapLibre
      options={{
        style: 'https://demotiles.maplibre.org/style.json',
      }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    />
  );
};

render(() => <App />, document.getElementById("app")!);
```

## Roadmap

* [x] Basic Mapbox GL Functionality
* [x] Include Map Controls
* [x] Include Fog, Sky, and Terrain
* [x] Include Popup and Markers
* [x] Minify bundle & reduce size
* [x] Add basemap switching
* [x] Include event handling
* [x] Sync Maps
* [x] Add MapLibre support
* [ ] Add draw functionality
* [ ] Add debug functionality
