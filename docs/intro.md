![](docs/gallery.png)

## Solid Mapbox GL JS

[Solid](https://www.solidjs.com/) Component Library for [Mapbox GL JS.](https://github.com/mapbox/mapbox-gl-js) Mapbox GL JS is a JavaScript library that renders interactive maps from vector tiles and Mapbox styles using WebGL. This project is intended to be as close as possible to the [Mapbox GL JS API.](https://docs.mapbox.com/mapbox-gl-js/api/)


### Usage

To use any of Mapbox’s tools, APIs, or SDKs, you’ll need a Mapbox [access token](https://www.mapbox.com/help/define-access-token/). Mapbox uses access tokens to associate requests to API resources with your account. You can find all your access tokens, create new ones, or delete existing ones on your [API access tokens page](https://www.mapbox.com/studio/account/tokens/).

**Static Map**

By default, `MapGL` component renders in a static mode. That means that the user cannot interact with the map.

```jsx
import MapGL from 'solid-map-gl'
<MapGL
  options={{
    accessToken: MAPBOX_ACCESS_TOKEN,
    style: 'mapbox://styles/mapbox/light-v10',
  }}
  viewport={{
    center: [-122.41, 37.78],
    zoom: 11,
  }}>
</MapGL>
```

**Interactive Map**

In most cases, you will want the user to interact with the map. To do this, you need to provide `onViewportChange` handler, that will update the map's viewport state.

```jsx
import { createSignal } from 'solid-js'
import MapGL from 'solid-map-gl'
import type { Viewport } from 'solid-map-gl'

const [viewport, setViewport] = createSignal({
    center: [-122.41, 37.78],
    zoom: 11
} as Viewport);

<MapGL
    options={{
        accessToken: MAPBOX_ACCESS_TOKEN,
        style: 'mapbox://styles/mapbox/light-v10'
    }}
    viewport={viewport()}
    onViewportChange={evt => setViewport(evt)}>
</MapGL>
```

### Roadmap

* [x] Basic Mapbox GL Functionality
* [x] Include Map Controls
* [x] Include Fog, Sky, and Terrain
* [x] Include Popup and Markers
* [x] Minify bundle & reduce size
* [x] Add basemap switching
* [x] Include event handling
* [x] Sync Maps
* [ ] Add draw functionality
