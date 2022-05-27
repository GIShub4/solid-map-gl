---
description: Installation and basic usage
---

# Getting Started

`solid-map-gl` requires `mapbox-gl` as peer dependency

{% tabs %}
{% tab title="Existing project" %}
```shell
pnpm add mapbox-gl solid-map-gl
# or
yarn add mapbox-gl solid-map-gl
# or
npm i mapbox-gl solid-map-gl
```
{% endtab %}

{% tab title="New project" %}
use [`pnpm`](https://pnpm.io/) (preferred)

```shell
pnpm dlx degit solidjs/templates/ts my-app && cd my-app
pnhpm i
pnpm add mapbox-gl solid-map-gl
pnpm dev
```

or `npm`

```shell
npx degit solidjs/templates/ts my-app && cd my-app
npm i
npm i mapbox-gl solid-map-gl
npm start
```
{% endtab %}
{% endtabs %}

{% hint style="warning" %}
If you use **vite** and get the following error:

<mark style="color:red;">'mapbox-gl.js' does not provide an export named 'default'</mark>

add this to your **vite.config.ts** file:

`optimizeDeps: {include: ['mapbox-gl']}`
{% endhint %}

### Usage

To use any of Mapbox’s tools, APIs, or SDKs, you’ll need a Mapbox [access token](https://www.mapbox.com/help/define-access-token/). Mapbox uses access tokens to associate requests to API resources with your account. You can find all your access tokens, create new ones, or delete existing ones on your [API access tokens page](https://www.mapbox.com/studio/account/tokens/).

**Static Map**

By default, `MapGL` component renders in a static mode. That means that the user cannot interact with the map.

```jsx
import MapGL from 'solid-map-gl'
<MapGL
  options={{
    accessToken: MAPBOX_ACCESS_TOKEN,
    style: 'mb:basic',
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
        style: 'mb:light'
    }}
    viewport={viewport()}
    onViewportChange={(evt:Event) => setViewport(evt)}>
</MapGL>
```
