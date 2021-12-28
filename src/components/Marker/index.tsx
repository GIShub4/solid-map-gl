import { onMount, onCleanup, createEffect, Component, children } from 'solid-js'
import { useMap } from '../MapGL'
import mapboxgl from 'mapbox-gl'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type { MarkerSpecification } from 'mapbox-gl/src/style-spec/types.js'

const Marker: Component<{
  options?: MarkerSpecification
  lnglat: number[]
}> = props => {
  const map: MapboxMap = useMap()
  let marker = null

  // Add Marker
  onMount(async () => {
    marker = new mapboxgl.Marker(props.options)
      .setLngLat(props.lnglat)
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
  createEffect(() => marker.setLngLat(props.lnglat))

  return <></>
}

export default Marker
