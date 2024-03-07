---
description: Provides interface components for map controls such as navigation buttons, scale bars, etc.
---

# Control Component

The Control component is used to add various control elements to your map, which enhance the user's interaction with the map.

## Props

The following table lists the props for the `Control` component:

| Name     | Type   | Description                                                                                                                                    | Default Value |
| -------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| type\*   | string | Specifies the type of control to add. Accepted values: `navigation`, `scale`, `attribution`, `fullscreen`, `geolocate`, `language`, `traffic`. | —             |
| options  | object | Additional options for the control as documented in [Control Options](https://docs.mapbox.com/mapbox-gl-js/api/markers/).                      | {}            |
| position | string | Determines the position of the control on the map. Choices: `top-left`, `top-right`, `bottom-left`, `bottom-right`.                            | `top-right`   |

_\* indicates a required property._

#### Optional Dependencies

To use some of the control types, you will need to install optional dependencies. Below are the instructions for installing these dependencies using `pnpm`.

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

Here is an example of how to integrate the `Control` component within the `MapGL` component from `solid-map-gl`.

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
