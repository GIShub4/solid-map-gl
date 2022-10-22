import { onCleanup, createEffect, Component, untrack } from 'solid-js'
import { useMap } from '../MapGL'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type {
  Popup as PopupType,
  PopupOptions,
} from 'mapbox-gl/src/ui/popup.js'
import type { LngLatLike } from 'mapbox-gl/src/geo/lng_lat.js'

export const Popup: Component<{
  options?: PopupOptions
  trackPointer?: boolean
  lngLat: LngLatLike
  onClose?: Function
  children?: any
}> = props => {
  const map: MapboxMap = useMap()()
  let popup: PopupType = null

  // Remove Popup
  onCleanup(() => popup?.remove())

  // Add/Update Popup
  createEffect(() => {
    if (!props.trackPointer && !props.lngLat)
      throw new Error('Popup - lngLat is required')
    popup?.remove()
    popup = new map.mapLib.Popup(
      props.trackPointer
        ? { ...props.options, closeOnClick: false, closeButton: false }
        : { focusAfterOpen: false, ...props.options }
    )
      .setHTML(untrack(() => props.children))
      .setLngLat(untrack(() => props.lngLat))
      .on('close', () => props.onClose?.())
      .addTo(map)
  })

  // Update Position
  createEffect(() =>
    props.trackPointer ? popup.trackPointer() : popup.setLngLat(props.lngLat)
  )

  // Update Content
  createEffect(() => popup.setHTML(props.children))

  return null
}
