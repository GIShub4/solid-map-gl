import { onCleanup, createEffect, Component, untrack } from 'solid-js'
import { useMap } from '../MapGL'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type {
  Popup as PopupType,
  PopupOptions,
} from 'mapbox-gl/src/ui/popup.js'
import type {
  Marker as MarkerType,
  MarkerOptions,
} from 'mapbox-gl/src/ui/marker.js'
import type { LngLatLike } from 'mapbox-gl/src/geo/lng_lat.js'

export const Marker: Component<{
  options?: MarkerOptions & { popup: PopupOptions }
  lngLat: LngLatLike
  openPopup?: boolean
  draggable?: boolean
  onLngLatChange?: Function
  onClose?: Function
  onDragStart?: Function
  onDragEnd?: Function
  children?: any
}> = props => {
  const map: MapboxMap = useMap?.()()
  let marker: MarkerType = null
  let popup: PopupType = null

  // Remove Marker
  onCleanup(() => marker?.remove())

  // Add/Update Marker
  createEffect(() => {
    if (untrack(() => !props.openPopup && !props.lngLat))
      throw new Error('Marker - lngLat is required')

    popup?.remove()
    popup = untrack(() => props.children)
      ? new map.mapLib.Popup(props.options.popup)
          .setHTML(untrack(() => props.children))
          .on('close', () => props.onClose?.())
      : null

    marker?.remove()
    marker = new map.mapLib.Marker(props.options)
      .setPopup(popup)
      .on('dragstart', () => props.onDragStart?.())
      .on('dragend', () => props.onDragEnd?.())
      .on('drag', () => props.onLngLatChange?.(marker.getLngLat().toArray()))
    untrack(() => {
      marker.setDraggable(props.draggable).setLngLat(props.lngLat).addTo(map)
      popup && props.openPopup !== popup.isOpen() && marker.togglePopup()
    })
  })

  // Toggle Popup
  createEffect(
    () => popup && props.openPopup !== popup.isOpen() && marker.togglePopup()
  )

  // Update Position
  createEffect(() => marker.setLngLat(props.lngLat))

  // Update Popup Content
  createEffect(() => popup.setHTML(props.children))

  // Update Draggable
  createEffect(() => marker.setDraggable(props.draggable))

  return null
}
