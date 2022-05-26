# Solid Component for Mapbox GL JS Control

## Props

| Prop     | Type   | Description                                                                          |
| -------- | ------ | ------------------------------------------------------------------------------------ |
| type\*   | string | navigation \| scale \| attribution \| fullscreen \| geolocate \| language \| traffic |
| options  | object | [Control Options](https://docs.mapbox.com/mapbox-gl-js/api/markers/)                 |
| position | string | top-left \| top-right^ \| bottom-left \| bottom-right                                |

_\*required_\
_^default_

\


`When using language or traffic type you must import the required library`

```shell
yarn add @mapbox/mapbox-gl-language @mapbox/mapbox-gl-traffic
```

## Example

```jsx
import { Component, createSignal } from 'solid-js'
import MapGL, { Viewport, Control } from 'solid-map-gl'

const Map: Component = props => {
    const [viewport, setViewport] = createSignal({
        center: [0, 0]
        zoom: 6,
    } as Viewport)

    return (
    <MapGL
        options={{
            accessToken: { MAPBOX_ACCESS_TOKEN },
            style: 'mapbox://styles/mapbox/light-v10',
        }}
        viewport={viewport()}
        onViewportChange={evt => setViewport(evt)}>
            <Control type='navigation' position='top-left' />
            <Control type='fullscreen' position='top-right' />
    </MapGL>
    )
}
```
