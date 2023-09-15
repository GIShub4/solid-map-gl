import { describe, it } from 'vitest'
import { render } from '@solidjs/testing-library'
import MapGL, { Terrain } from '../..'

describe('Terrain', () => {
  it('renders', () =>
    render(() => (
      //   <MapGL options={{ testMode: true }}>
      <Terrain />
      //   </MapGL>
    )))
})
