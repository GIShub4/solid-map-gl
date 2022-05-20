import { describe, it } from 'vitest'
import { render } from 'solid-testing-library'
import MapGL from '../..'

describe('Map', () => {
  it('renders', async () => {
    await render(() => <MapGL options={{ testMode: true }}></MapGL>)
  })

  // it('renders with static viewport', () => {
  //   render(() => <MapGL viewport={{ center: [0, 0], zoom: 5 }}></MapGL>)
  // })
})
