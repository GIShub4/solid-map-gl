import { render } from 'solid-js/web'
import { Component, createSignal } from 'solid-js'
import MapGL, { Viewport } from 'solid-map-gl'
import * as maplibre from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const [viewport, setViewport] = createSignal({
  center: [0, 50],
  zoom: 4,
} as Viewport)

const App: Component = () => (
  <MapGL
    mapLib={maplibre}
    options={{ style: 'https://demotiles.maplibre.org/style.json' }}
    viewport={viewport()}
    onViewportChange={(evt: Viewport) => setViewport(evt)}></MapGL>
)

render(() => <App />, document.getElementById('root') as HTMLElement)
