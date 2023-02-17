import { describe, it } from 'vitest'
import { render } from '@solidjs/testing-library'
import MapGL from '../..'
import 'mapbox-gl/dist/mapbox-gl.css'

describe('Map', () => {
  it('renders', async () =>
    await render(() => <MapGL options={{ testMode: true }}></MapGL>))

  // it('renders with static viewport', async () => {
  //   await render(() => <MapGL viewport={{ center: [0, 0], zoom: 5 }}></MapGL>)
  // })
})
