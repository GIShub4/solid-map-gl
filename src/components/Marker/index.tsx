import { onCleanup, createEffect, Component } from 'solid-js'
import { useMap } from '../MapGL'
import mapboxgl from 'mapbox-gl'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type { MarkerSpecification } from 'mapbox-gl/src/style-spec/types.js'
import type { LngLatLike } from 'mapbox-gl/src/geo/lng_lat.js'

export const Marker: Component<{
  options?: MarkerSpecification
  lngLat: LngLatLike
  children?: any
}> = props => {
  const map: MapboxMap = useMap()
  let marker = null

  // Add Marker
  createEffect(() => {
    marker = new mapboxgl.Marker(props.options)
      .setLngLat(props.lngLat)
      .setPopup(
        props.children
          ? new mapboxgl.Popup().setDOMContent(<div>{props.children}</div>)
          : null
      )
      .addTo(map())
  })
  // Remove Marker
  onCleanup(() => marker.remove())

  // Update Position
  createEffect(() => marker && marker.setLngLat(props.lngLat))

  return <></>
}
