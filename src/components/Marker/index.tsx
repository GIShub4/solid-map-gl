import { onCleanup, createEffect, Component } from 'solid-js'
import { useMap } from '../MapGL'
import mapboxgl from 'mapbox-gl'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type {
  MarkerSpecification,
  PopupSpecification,
} from 'mapbox-gl/src/style-spec/types.js'
import type { LngLatLike } from 'mapbox-gl/src/geo/lng_lat.js'

export const Marker: Component<{
  options?: MarkerSpecification
  lngLat: LngLatLike
  children?: any
}> = props => {
  const map: MapboxMap = useMap()
  let marker = null
  let popup = null

  // Add Marker
  createEffect(() => {
    if (marker) return
    if (props.children)
      popup = new mapboxgl.Popup(
        props.options.popup as PopupSpecification
      ).setDOMContent(<div>{props.children}</div>)

    marker = new mapboxgl.Marker(props.options)
      .setLngLat(props.lngLat)
      .setPopup(popup)
      .addTo(map())
    marker.togglePopup()
  })
  // Remove Marker
  onCleanup(() => marker?.remove())

  // Update Position
  createEffect(() => marker?.setLngLat(props.lngLat))

  // Update Content
  createEffect(() => popup?.setDOMContent(<div>{props.children}</div>))

  return <></>
}
