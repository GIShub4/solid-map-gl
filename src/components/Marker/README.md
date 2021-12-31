# Solid Component for [Mapbox GL JS Marker](https://docs.mapbox.com/mapbox-gl-js/api/markers/#marker)

## Props

| Prop     | Type                                                                               | Description                                                                              |
| -------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| options  | object                                                                             | [Marker Parameters](https://docs.mapbox.com/mapbox-gl-js/api/markers/#marker-parameters) |
| lnglat\* | [LngLatLike](https://docs.mapbox.com/mapbox-gl-js/api/geography/#lnglatlike)       | Marker Location                                                                          |
| children | [HTML Element \| String](https://developer.mozilla.org/en-US/docs/Web/API/Element) | Marker Popup Content                                                                     |

_\*required_

## Example

```jsx
import { Component, createSignal } from 'solid-js'
import MapGL, { Viewport, Marker } from 'solid-map-gl'

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
        <Marker lnglat={[0, 0]} options={{color: '#F00'}}>
            Hi there! 👋
        </Marker>
    </MapGL>
    )
}
```
