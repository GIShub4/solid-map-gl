# Solid Component for [Mapbox GL JS Fog Layer](https://docs.mapbox.com/mapbox-gl-js/style-spec/fog/)

## Props

| Prop    | Type    | Description                                                             |
| ------- | ------- | ----------------------------------------------------------------------- |
| style\* | object  | [Fog style specs](https://docs.mapbox.com/mapbox-gl-js/style-spec/fog/) |
| visible | boolean | Show / Hide Layer                                                       |

_\*required_

## Example

```jsx
import { Component, createSignal } from 'solid-js'
import MapGL, { Viewport, Fog } from 'solid-map-gl'

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
        <Fog style={{
            "color": "white",
            "horizon-blend": 0.1
        }} />
    </MapGL>
    )
}
```
