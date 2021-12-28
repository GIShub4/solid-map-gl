import { onMount, onCleanup, createEffect, Component } from 'solid-js'
import { useMap } from '../MapGL'
import mapboxgl from 'mapbox-gl'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type { PopupSpecification } from 'mapbox-gl/src/style-spec/types.js'
import type { LngLatLike } from 'mapbox-gl/src/geo/lng_lat.js'

const Popup: Component<{
  options?: PopupSpecification
  lnglat: LngLatLike
}> = props => {
  const map: MapboxMap = useMap()
  let popup = null

  // Add Popup
  onMount(async () => {
    popup = new mapboxgl.Popup(props.options)
      .setLngLat(props.lnglat)
      .setDOMContent(<div>{props.children}</div>)
      .addTo(map())
  })
  // Remove Popup
  onCleanup(() => popup.remove())

  // Update Position
  createEffect(() => popup.setLngLat(props.lnglat))

  // Update Content
  createEffect(() => popup.setDOMContent(<div>{props.children}</div>))

  return <></>
}

export default Popup
