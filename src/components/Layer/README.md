# Solid Component for [Mapbox GL JS Layer](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/)

## Props

| Prop         | Type                                                                                              | Description                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| id           | string                                                                                            | only required if referrenced outside of nested layer                                                      |
| style        | object                                                                                            | [Layer Style Object](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/)                             |
| customLayer  | [CustomLayerInterface](https://docs.mapbox.com/mapbox-gl-js/api/properties/#customlayerinterface) | To include external layers e.g. [deck.gl](https://deck.gl/)                                               |
| filter       | [FilterSpecification](https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/)               | Filter expression                                                                                         |
| visible      | boolean                                                                                           | Show/Hide Layer                                                                                           |
| sourceId     | string                                                                                            | Required for Vector Sources                                                                               |
| beforeType   | string                                                                                            | background \| fill \| line \| symbol \| raster \| circle \| fill-extrusion \| heatmap \| hillshade \| sky |
| beforeId     | string                                                                                            | Id of Layer to insert Layer before                                                                        |
| featureState | object                                                                                            | Define Feature State                                                                                      |

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
        <Source
            source={{
            type: 'geojson',
            data: 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson'
        }}>
            <Layer style={{
                type: 'circle',
                paint: {
                    'circle-radius': 8,
                    'circle-color': 'red',
                }
            }} />
        </Source>
    </MapGL>
    )
}
```
