# Solid Component for [Mapbox GL JS Image](https://docs.mapbox.com/mapbox-gl-js/api/sources/)

> ### props
>
> ---
>
> `id`: [String]()
>
> `url?`: [String](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#loadimage) Loadable Image URL
>
> `image?`: [HTMLImageElement | ImageBitmap | ImageData | {width: number, height: number, data: (Uint8Array | Uint8ClampedArray)} | StyleImageInterface](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addimage)
>
> `options?`: [Add image options](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addimage)

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
        <Image id='cat' url='https://docs.mapbox.com/mapbox-gl-js/assets/cat.png'>
        <Source
            source={{
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                    features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [-77.4144, 25.0759]
                        }
                    }
                ]
            }
        }}>
            <Layer style={{
                type: 'point',
                layout: {
                    'icon-image': 'cat',
                    'icon-size': 0.25
                }
            }} />
        </Source>
    </MapGL>
    )
}
```
