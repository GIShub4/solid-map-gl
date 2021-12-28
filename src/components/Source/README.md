# Solid Component for [Mapbox GL JS Source](https://docs.mapbox.com/mapbox-gl-js/api/sources/)

> ### props
>
> ---
>
> `source`: [Source style specs](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/)
>
> `id?`: [String]() required if Layer Components are not nested

<br>

```jsx
import { Component, createSignal } from 'solid-js'
import MapGL, { Viewport, Source, Layer } from '../solid-map-gl'

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
            type: 'geojson',
            data: 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson'
        }}>
            <Layer style={{ 'type': 'circle',
                'source': 'earthquakes',
                'paint': {
                    'circle-radius': 8,
                    'circle-color': 'red',
                }
            }} />
        </Source>
    </MapGL>
    )
}
```
