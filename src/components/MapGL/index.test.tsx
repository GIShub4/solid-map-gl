import { describe, it } from 'vitest'
import { render } from 'solid-testing-library'
import MapGL from '../..'
import 'mapbox-gl/dist/mapbox-gl.css'

describe('Map', () => {
  it('renders', async () => {
    await render(() => <MapGL></MapGL>)
  })

  // it('renders with static viewport', () => {
  //   render(() => <MapGL viewport={{ center: [0, 0], zoom: 5 }}></MapGL>)
  // })
})
