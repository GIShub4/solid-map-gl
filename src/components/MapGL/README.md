# Solid Component for [Mapbox GL JS Map](https://docs.mapbox.com/mapbox-gl-js/api/map/#map-parameters)

## Props

| Prop             | Type    | Description                           |
| ---------------- | ------- | ------------------------------------- |
| class            | object  | css class attached to map element     |
| classlist        | object  | css classlist attached to map element |
| viewport         | object  |                                       |
| options          | object  |                                       |
| triggerResize    | boolean |                                       |
| transitionType   | string  | flyTo^, easeTo, jumpTo                |
| onViewportChange | Event   |                                       |
| on[Event]        | Event   |  Any [Map Event](https://docs.mapbox.com/mapbox-gl-js/api/map/#map-events) - eg.: onMouseMove                                   |

_\*required_<br>
_\^default_

## Example

```jsx
import { Component, createSignal } from 'solid-js'
import MapGL, { Viewport } from 'solid-map-gl'

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
    </MapGL>
    )
}
```
