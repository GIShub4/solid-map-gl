# Solid Component for [Mapbox GL JS Image](https://docs.mapbox.com/mapbox-gl-js/api/sources/)

## Props

| Prop    | Type                                                                                                                                                                                                               | Description                                                                       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| id\*    | string                                                                                                                                                                                                             | Id to reference image in layer style                                              |
| url     | string                                                                                                                                                                                                             | [Loadable Image URL](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#loadimage) |
| image   | [HTMLImageElement \| ImageBitmap \| ImageData \| StyleImageInterface \|<br> {width: number, height: number, data: (Uint8Array \| Uint8ClampedArray)} ](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addimage) | Image Data                                                                        |
| options | object                                                                                                                                                                                                             | [Add image options](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addimage)   |

_\*required_

## Example

```jsx
import { Component, createSignal } from 'solid-js'
import MapGL, { Viewport, Source, Layer } from 'solid-map-gl'

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
