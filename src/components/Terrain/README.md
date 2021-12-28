# Solid Component for [Mapbox GL JS Terrain Layer](https://docs.mapbox.com/mapbox-gl-js/style-spec/terrain/)

> ### props
>
> ---
>
> `style`: [Terrain style specs](https://docs.mapbox.com/mapbox-gl-js/style-spec/terrain/)
>
> `visible`: [Boolean]()

<br>

```jsx
import { Component, createSignal } from 'solid-js'
import MapGL, { Viewport, Source, Terrain } from '../solid-map-gl'

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
        <Source
            source={{
              type: 'raster-dem',
              url: 'mapbox://mapbox.terrain-rgb',
              tileSize: 512,
              maxzoom: 14,
            }}>
            <Terrain style={{ exaggeration: 2 }} />
        </Source>
    </MapGL>
    )
}
```
