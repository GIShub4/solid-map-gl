[![Banner](https://assets.solidjs.com/banner?project=solid-map-gl&background=tiles&type=Mapping%20Plugin)](https://gis-hub.gitbook.io/solid-map-gl)

# **_Solid Map GL_** for Mapbox & MapLibre

[![npm](https://img.shields.io/npm/v/solid-map-gl)](https://www.npmjs.com/package/solid-map-gl)
[![downloads](https://img.shields.io/npm/dt/solid-map-gl)](https://www.npmjs.com/package/solid-map-gl)
[![licence](https://img.shields.io/npm/l/solid-map-gl?color=blue)](LICENSE/)
[![size](https://img.shields.io/bundlephobia/min/solid-map-gl)](https://bundlephobia.com/package/solid-map-gl)
[![treeshaking](https://img.shields.io/badge/treeshaking-supported-success)](https://bundlephobia.com/package/solid-map-gl)
![ts](https://img.shields.io/badge/types-included-blue?logo=typescript&logoColor=white)

[SolidJS](https://www.solidjs.com/) Component Library for [Mapbox GL JS](https://github.com/mapbox/mapbox-gl-js) and [MapLibre GL.](https://maplibre.org/projects/maplibre-gl-js/) Both libraries render interactive maps from vector tiles and Map styles using WebGL. This project is intended to be as close as possible to the [Mapbox GL JS API.](https://docs.mapbox.com/mapbox-gl-js/api/)

## [Documentation & Examples](https://gis-hub.gitbook.io/solid-map-gl)

[![Gallery](/docs/header.png)](https://gis-hub.gitbook.io/solid-map-gl)

## [Getting Started](https://gis-hub.gitbook.io/solid-map-gl/start)

### Installation

```shell
pnpm add mapbox-gl solid-map-gl
yarn add mapbox-gl solid-map-gl
npm  i   mapbox-gl solid-map-gl
```

#### Use with [Solid Start](https://github.com/solidjs/solid-start)

```shell
pnpm create solid && pnpm i
pnpm add mapbox-gl solid-map-gl
pnpm dev
```

## [Components](https://gis-hub.gitbook.io/solid-map-gl/components)

| Component                                                                   | Description                                                                                                            |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [MapGL](https://gis-hub.gitbook.io/solid-map-gl/components/mapgl)           | Represents map on the page                                                                                             |
| [Source](https://gis-hub.gitbook.io/solid-map-gl/components/source)         | [Sources](https://docs.mapbox.com/mapbox-gl-js/api/#sources) specify the geographic features to be rendered on the map |
| [Layer](https://gis-hub.gitbook.io/solid-map-gl/components/layer)           | [Layers](https://docs.mapbox.com/mapbox-gl-js/style-spec/#layers) specify the `Sources`                                |
| [Layer3D](https://gis-hub.gitbook.io/solid-map-gl/components/layer3d)       | Component for [BabylonJS](https://www.babylonjs.com/) or [ThreeJS](https://threejs.org/)                               |
| [Atmosphere](https://gis-hub.gitbook.io/solid-map-gl/components/atmosphere) | Specify the Atmosphere                                                                                                 |
| [Light](https://gis-hub.gitbook.io/solid-map-gl/components/light)           | Specify the Light Source                                                                                               |
| [Terrain](https://gis-hub.gitbook.io/solid-map-gl/components/terrain)       | Specify the Terrain                                                                                                    |
| [Image](https://gis-hub.gitbook.io/solid-map-gl/components/image)           | Adds an image to the map style                                                                                         |
| [Popup](https://gis-hub.gitbook.io/solid-map-gl/components/popup)           | Component for [Mapbox GL JS Popup](https://docs.mapbox.com/mapbox-gl-js/api/#popup)                                    |
| [Marker](https://gis-hub.gitbook.io/solid-map-gl/components/marker)         | Component for [Mapbox GL JS Marker](https://docs.mapbox.com/mapbox-gl-js/api/#marker)                                  |
| [Control](https://gis-hub.gitbook.io/solid-map-gl/components/control)       | Represents the map's control                                                                                           |
| [Camera](https://gis-hub.gitbook.io/solid-map-gl/components/camera)         | Map's camera view                                                                                                      |
| [Draw](https://gis-hub.gitbook.io/solid-map-gl/components/draw)             | Draw Control view                                                                                                      |

## Usage with [Mapbox](https://docs.mapbox.com/mapbox-gl-js/guides/)

Pass the _Mapbox access token_ via `<MapGL> options` or `.env` file as `VITE_MAPBOX_ACCESS_TOKEN`

```jsx
import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css'

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.45, 37.78],
    zoom: 11,
  } as Viewport);

  return (
    <MapGL
      options={{ style: "mb:light" }}
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

Install MapLibre package and placeholder Mapbox package

```shell
pnpm add solid-map-gl maplibre-gl mapbox-gl@npm:empty-npm-package@1.0.0
yarn add solid-map-gl maplibre-gl mapbox-gl@npm:empty-npm-package@1.0.0
npm  i   solid-map-gl maplibre-gl mapbox-gl@npm:empty-npm-package@1.0.0
```

```jsx
import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";
import * as maplibre from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.45, 37.78],
    zoom: 11,
  } as Viewport);

  return (
    <MapGL
      mapLib={maplibre} // <- Pass MapLibre package here
      options={{ style: 'https://demotiles.maplibre.org/style.json' }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    />
  );
};

render(() => <App />, document.getElementById("app")!);
```

## Roadmap

- [x] Basic Mapbox GL Functionality
- [x] Include Map Controls
- [x] Include Fog, Sky, and Terrain
- [x] Include Popup and Markers
- [x] Minify bundle & reduce size
- [x] Add basemap switching
- [x] Include event handling
- [x] Sync Maps
- [x] Add MapLibre support
- [x] Add debug functionality
- [x] Add draw functionality
- [x] Add 3D library support
