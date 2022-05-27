---
description: Solid Map GL provides Mapbox functionality within SolidJS applications
cover: .gitbook/assets/header.png
coverY: -235.96196049743963
layout: landing
---

# Introduction

[SolidJS](https://www.solidjs.com/) Component Library for [Mapbox GL JS.](https://github.com/mapbox/mapbox-gl-js) Mapbox GL JS is a JavaScript library that renders interactive maps from vector tiles and Mapbox styles using WebGL. This project is intended to be as close as possible to the [Mapbox GL JS API.](https://docs.mapbox.com/mapbox-gl-js/api/)

#### **Code example**

```jsx
import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";

const Map: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [0, 0],
    zoom: 6,
  } as Viewport);

  return (
    <MapGL
      options={{
        accessToken: MAPBOX_ACCESS_TOKEN,
        style: "mb:light",
      }}
      viewport={viewport()}
      onViewportChange={(evt: Event) => setViewport(evt)}
    ></MapGL>
  );
};

render(() => <Map />, document.getElementById("app")!);
```

#### Roadmap

* [x] Basic Mapbox GL Functionality
* [x] Include Map Controls
* [x] Include Fog, Sky, and Terrain
* [x] Include Popup and Markers
* [x] Minify bundle & reduce size
* [x] Add basemap switching
* [x] Include event handling
* [x] Sync Maps
* [ ] Add draw functionality
