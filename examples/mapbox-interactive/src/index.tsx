import { render } from 'solid-js/web'
import { Component, createSignal } from 'solid-js'
import MapGL, { Viewport } from 'solid-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const [viewport, setViewport] = createSignal({
  center: [-122.45, 37.78],
  zoom: 11,
} as Viewport)

const App: Component = () => (
  <MapGL
    options={{
      style: 'mb:basic',
    }}
    viewport={viewport()}
    onViewportChange={(evt: Viewport) => setViewport(evt)}></MapGL>
)

render(() => <App />, document.getElementById('root') as HTMLElement)
