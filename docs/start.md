---
description: Installation and basic usage
---

# 🚀 Getting Started

`solid-map-gl` requires `mapbox-gl` or `maplibre-gl` as peer dependency

{% tabs %}
{% tab title="Existing project" %}
```shell
pnpm add mapbox-gl solid-map-gl
yarn add mapbox-gl solid-map-gl
npm  i   mapbox-gl solid-map-gl
```
{% endtab %}

{% tab title="Solid Start" %}
```shell
pnpm create solid && pnpm i
pnpm add mapbox-gl solid-map-gl
pnpm dev
```
{% endtab %}

{% tab title="With MapLibre project" %}
```shell
pnpm create solid && pnpm i
# Install MapLibre package and placeholder Mapbox package
pnpm add solid-map-gl maplibre-gl mapbox-gl@npm:empty-npm-package@1.0.0
pnpm dev
```
{% endtab %}
{% endtabs %}

{% hint style="danger" %}
If you use `vite` and get the following error:

<mark style="color:red;">'mapbox-gl.js' does not provide an export named 'default'</mark>

add this to your `vite.config.ts` file:

`optimizeDeps: {include: ['mapbox-gl']}`
{% endhint %}

## Usage

To use any of Mapbox’s tools, APIs, or SDKs, you’ll need a Mapbox [access token](https://www.mapbox.com/help/define-access-token/). Mapbox uses access tokens to associate requests to API resources with your account. You can find all your access tokens, create new ones, or delete existing ones on your [API access tokens page](https://www.mapbox.com/studio/account/tokens/).

### **Static Map**

By default, `MapGL` component renders in a static mode. That means that the user cannot interact with the map.

```jsx
import { Component } from "solid-js";
import MapGL from "solid-map-gl";

const App: Component = () => (
  <MapGL
    options={{
      accessToken: MAPBOX_ACCESS_TOKEN,
      style: "mb:basic",
    }}
    viewport={{
      center: [-122.41, 37.78],
      zoom: 11,
    }}
  ></MapGL>
);
```

### **Interactive Map**

In most cases, you will want the user to interact with the map. To do this, you need to provide `onViewportChange` handler, that will update the map's viewport state.

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.41, 37.78],
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
    ></MapGL>
  );
};
```
