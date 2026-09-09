[![Banner](https://assets.solidjs.com/banner?project=solid-map-gl&background=tiles&type=Component%20Library)](https://gis-hub.gitbook.io/solid-map-gl)

# SolidJS Component Library for Mapbox GL & MapLibre GL

[![CI](https://img.shields.io/github/actions/workflow/status/GIShub4/solid-map-gl/ci.yml?branch=main&label=CI)](https://github.com/GIShub4/solid-map-gl/actions/workflows/ci.yml)
[![codecov](https://img.shields.io/codecov/c/github/GIShub4/solid-map-gl)](https://codecov.io/gh/GIShub4/solid-map-gl)
[![npm](https://img.shields.io/npm/v/solid-map-gl)](https://www.npmjs.com/package/solid-map-gl)
[![downloads](https://img.shields.io/npm/dt/solid-map-gl)](https://www.npmjs.com/package/solid-map-gl)
[![licence](https://img.shields.io/npm/l/solid-map-gl?color=blue)](LICENSE/)

[SolidJS](https://www.solidjs.com/) Component Library for [Mapbox GL JS](https://github.com/mapbox/mapbox-gl-js) and [MapLibre GL.](https://maplibre.org/projects/maplibre-gl-js/) Both libraries render interactive maps from vector tiles and Map styles using WebGL. This project is intended to be as close as possible to the [Mapbox GL JS API.](https://docs.mapbox.com/mapbox-gl-js/api/)

## Documentation & Examples

[![Gallery](/docs/header.png)](https://gis-hub.gitbook.io/solid-map-gl)

## Getting Started

#### [Mapbox GL](https://gis-hub.gitbook.io/solid-map-gl/start#existing-project)

```shell
pnpm add mapbox-gl solid-map-gl
yarn add mapbox-gl solid-map-gl
npm  i   mapbox-gl solid-map-gl
```

#### [MapLibre](https://gis-hub.gitbook.io/solid-map-gl/start#with-maplibre-project)

```shell
pnpm create solid && pnpm i
# Install MapLibre package and placeholder Mapbox package
pnpm add solid-map-gl maplibre-gl mapbox-gl@npm:empty-npm-package@1.0.0
pnpm dev
```

> [!NOTE]
> `npm` enforces peer-dependency version ranges more strictly than `pnpm`/`yarn` — the placeholder
> above satisfies them on `pnpm`/`yarn`, but `npm install` will fail with an `ERESOLVE` error since
> the placeholder's version doesn't match `solid-map-gl`'s declared `mapbox-gl` range. Use
> `pnpm`/`yarn` for this install, or run `npm install --legacy-peer-deps` if you must use `npm`.

#### [Solid Start](https://gis-hub.gitbook.io/solid-map-gl/start#solid-start)

```shell
pnpm create solid && pnpm i
pnpm add mapbox-gl solid-map-gl
pnpm dev
```

> [!CAUTION]
> If you use `vite` and get the error `'mapbox-gl.js' does not provide an export named 'default'`,
> add this to your `vite.config.ts`:
>
> ```ts
> optimizeDeps: { include: ['mapbox-gl'] }
> ```

## Components

| [Component](https://gis-hub.gitbook.io/solid-map-gl/components)                                                                   | Description                                                                                                            |
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
| [DeckOverlay](https://gis-hub.gitbook.io/solid-map-gl/components/deckoverlay) | Adds a [deck.gl](https://deck.gl/) overlay on top of the map                                                         |

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

> [!NOTE]
> `npm` enforces peer-dependency version ranges more strictly than `pnpm`/`yarn` — the placeholder
> above satisfies them on `pnpm`/`yarn`, but `npm install` will fail with an `ERESOLVE` error since
> the placeholder's version doesn't match `solid-map-gl`'s declared `mapbox-gl` range. Use
> `pnpm`/`yarn` for this install, or run `npm install --legacy-peer-deps` if you must use `npm`.

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
- [x] Add 3D Layer support
- [x] Add deck.gl support
