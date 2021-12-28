# Solid Component for [Mapbox GL JS Sky Layer](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/#sky)

## Props

| Prop    | Type    | Description                                                                    |
| ------- | ------- | ------------------------------------------------------------------------------ |
| style\* | object  | [Sky style specs](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/#sky) |
| visible | boolean | Show / Hide Layer                                                              |

_\*required_

## Example

```jsx
import { Component, createSignal } from 'solid-js'
import MapGL, { Viewport, Sky } from '../solid-map-gl'

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
        <Sky style={{
            "type": "sky",
            "paint": {
                "sky-type": "gradient",
                "sky-opacity-transition": { "duration": 500 }
            }
        }} />
    </MapGL>
    )
}
```
