---
description: Represents the map's control
---

# Control

## Props

<table><thead><tr><th width="110.33333333333331">Name</th><th width="82">Type</th><th>Description</th></tr></thead><tbody><tr><td>type*</td><td>string</td><td>navigation | scale | attribution | fullscreen | geolocate | language | traffic</td></tr><tr><td>options</td><td>object</td><td><a href="https://docs.mapbox.com/mapbox-gl-js/api/markers/">Control Options</a></td></tr><tr><td>position</td><td>string</td><td>top-left | top-right^ | bottom-left | bottom-right</td></tr></tbody></table>

_\*required_\
_^default_

#### Optional Dependencies

{% tabs %}
{% tab title="Traffic" %}
```
pnpm add @mapbox/mapbox-gl-traffic
```
{% endtab %}

{% tab title="Language" %}
```
pnpm add @mapbox/mapbox-gl-language
```
{% endtab %}
{% endtabs %}

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Control } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = (props) => {
  const [viewport, setViewport] = createSignal({
    center: [0, 52],
    zoom: 6,
  } as Viewport);

  return (
    <MapGL
      options={{ style: 'mb:light' }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Control type="navigation" position="top-left" />
      <Control type="fullscreen" position="top-right" />
    </MapGL>
  );
};
```
