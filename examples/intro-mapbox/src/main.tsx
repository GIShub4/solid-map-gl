import { render } from 'solid-js/web'
import { Component, createSignal } from 'solid-js'
import MapGL, { Viewport, Marker } from 'solid-map-gl'

const places = [
  [-0.118092, 51.509865], // London
  [30.523333, 50.450001], // Kyiv
  [2.154007, 41.390205], // Bacelona
]

const [viewport, setViewport] = createSignal({
  center: places[0],
  zoom: 11,
} as Viewport)

const rotate = (idx: number = 1) =>
  setTimeout(() => {
    setViewport(v => ({ ...v, center: places[++idx % places.length] }))
    rotate(idx)
  }, 9000)

setTimeout(() => setViewport(v => ({ ...v, center: places[1] })), 1000)
rotate()

const App: Component = () => (
  <MapGL
    options={{
      accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
      style: 'mb:basic',
    }}
    viewport={viewport()}
    onViewportChange={(evt: Viewport) => setViewport(evt)}>
    {places.map(place => (
      <Marker lngLat={place} />
    ))}
  </MapGL>
)

render(() => <App />, document.getElementById('root') as HTMLElement)
