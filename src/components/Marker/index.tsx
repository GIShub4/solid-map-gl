import { onCleanup, createEffect, Component, untrack } from 'solid-js'
import { useMap } from '../MapGL'
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
  if (!useMap()) return
  const [map] = useMap()
  let marker: MarkerType = null
  let popup: PopupType = null

  if (!props.lngLat) throw new Error('Marker - lngLat is required')

  // Add or Update Marker
  createEffect(() => {
    const ops = { ...props.options }
    const pops = { ...props.options?.popup }
    untrack(() => {
      popup?.remove()
      popup = props.children
        ? new map().mapLib
            .Popup(pops)
            .setHTML(props.children)
            .on('close', () => props.onClose?.())
        : null

      marker?.remove()
      marker = new map().mapLib
        .Marker(ops)
        .setPopup(popup)
        .on('dragstart', () => props.onDragStart?.())
        .on('dragend', () => props.onDragEnd?.())
        .on('drag', () => props.onLngLatChange?.(marker.getLngLat().toArray()))
      marker.setDraggable(props.draggable).setLngLat(props.lngLat).addTo(map())
      props.openPopup !== popup?.isOpen() && marker.togglePopup()
    })
  })

  // Toggle Popup
  createEffect(
    () => props.openPopup !== popup?.isOpen() && marker.togglePopup()
  )

  // Update Position
  createEffect(() => marker.setLngLat(props.lngLat))

  // Update Popup Content
  createEffect(() => popup?.setHTML(props.children))

  // Update Draggable
  createEffect(() => marker.setDraggable(props.draggable))

  // Remove Marker
  onCleanup(() => marker?.remove())

  return null
}
