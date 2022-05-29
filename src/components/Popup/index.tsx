import { onCleanup, createEffect, Component } from 'solid-js'
import { useMap } from '../MapGL'
import mapboxgl from 'mapbox-gl'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type { PopupSpecification } from 'mapbox-gl/src/style-spec/types.js'
import type { LngLatLike } from 'mapbox-gl/src/geo/lng_lat.js'

export const Popup: Component<{
  options?: PopupSpecification
  lngLat: LngLatLike
  children?: any
}> = props => {
  const map: MapboxMap = useMap()
  let popup = null

  // Add Popup
  createEffect(() => {
    popup = new mapboxgl.Popup(props.options)
      .setLngLat(props.lngLat)
      .setDOMContent(<div>{props.children}</div>)
      .addTo(map())
  })

  // Remove Popup
  onCleanup(() => popup.remove())

  // Update Position
  createEffect(() => popup && popup.setLngLaL(props.lngLat))

  // Update Content
  createEffect(() => popup && popup.setDOMContent(<div>{props.children}</div>))

  return <></>
}
