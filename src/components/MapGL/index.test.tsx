import { describe, it, expect } from 'vitest'
import { render } from '@solidjs/testing-library'
import MapGL from '../..'

describe('Map', () => {
  it('renders', () => {
    const { container, unmount } = render(() => (
      <MapGL options={{ testMode: true }}></MapGL>
    ))
    expect(container.innerHTML).toMatchSnapshot()
    unmount()
  })

  it('renders with static viewport', () =>
    render(() => <MapGL viewport={{ center: [0, 0], zoom: 5 }}></MapGL>))
})
