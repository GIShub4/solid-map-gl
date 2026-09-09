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

{% hint style="info" %}
`npm` enforces peer-dependency version ranges more strictly than `pnpm`/`yarn` — the placeholder
above satisfies them on `pnpm`/`yarn`, but `npm install` will fail with an `ERESOLVE` error since
the placeholder's version doesn't match `solid-map-gl`'s declared `mapbox-gl` range. Use
`pnpm`/`yarn` for this install, or run `npm install --legacy-peer-deps` if you must use `npm`.
{% endhint %}

{% hint style="danger" %}
If you use `vite` and get the following error:

<mark style="color:red;">'mapbox-gl.js' does not provide an export named 'default'</mark>

add this to your `vite.config.ts` file:

`optimizeDeps: {include: ['mapbox-gl']}`
{% endhint %}

## Stylesheet

`solid-map-gl` does not bundle or auto-load the base map CSS — import it yourself, matching whichever library you're actually using. Import the wrong one (or none) and the map renders with broken layout (missing size, controls piled in a corner, etc).

{% tabs %}
{% tab title="Mapbox" %}
```js
import "mapbox-gl/dist/mapbox-gl.css";
```
{% endtab %}

{% tab title="MapLibre" %}
```js
import "maplibre-gl/dist/maplibre-gl.css";
```
{% endtab %}
{% endtabs %}

## Usage

To use any of Mapbox’s tools, APIs, or SDKs, you’ll need a Mapbox [access token](https://www.mapbox.com/help/define-access-token/). Mapbox uses access tokens to associate requests to API resources with your account. You can find all your access tokens, create new ones, or delete existing ones on your [API access tokens page](https://www.mapbox.com/studio/account/tokens/). Then pass the *Mapbox access token* via `<MapGL> options` or `.env` file as `VITE_MAPBOX_ACCESS_TOKEN`

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
  const [viewport, setViewport] = createSignal<Viewport>({
    center: [-122.41, 37.78],
    zoom: 11,
  });

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
