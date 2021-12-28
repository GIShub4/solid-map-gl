# Solid Component for [Mapbox GL JS Popup](https://docs.mapbox.com/mapbox-gl-js/api/markers/#popup)

## Props

| Prop     | Type                                                                               | Description                                                                            |
| -------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| options  | object                                                                             | [Popup Parameters](https://docs.mapbox.com/mapbox-gl-js/api/markers/#popup-parameters) |
| lnglat\* | [LngLatLike](https://docs.mapbox.com/mapbox-gl-js/api/geography/#lnglatlike)       | Popup Location                                                                         |
| children | [HTML Element \| String](https://developer.mozilla.org/en-US/docs/Web/API/Element) | Popup Content                                                                          |

_\*required_

## Example

```jsx
import { Component, createSignal } from 'solid-js'
import MapGL, { Viewport, Popup } from '../solid-map-gl'

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
        <Popup lnglat={[0, 0]} options={{closeButton: false}}>
            Hi there! 👋
        </Popup>
    </MapGL>
    )
}
```
