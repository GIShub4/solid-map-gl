---
description: Represents the map's control
---

# Control

## Props

| Name     | Type   | Description                                                                          |
| -------- | ------ | ------------------------------------------------------------------------------------ |
| type\*   | string | navigation \| scale \| attribution \| fullscreen \| geolocate \| language \| traffic |
| options  | object | [Control Options](https://docs.mapbox.com/mapbox-gl-js/api/markers/)                 |
| position | string | top-left \| top-right^ \| bottom-left \| bottom-right                                |

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

const Map: Component = (props) => {
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
    >
      <Control type="navigation" position="top-left" />
      <Control type="fullscreen" position="top-right" />
    </MapGL>
  );
};
```
