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

type Props = {
  /** Options for the Mapbox GL JS marker */
  options?: MarkerOptions & {
    /** Options for the Mapbox GL JS popup that is associated with the marker */
    popup: PopupOptions
  }
  /** The geographical location to place the marker */
  lngLat: LngLatLike
  /** Whether the marker's associated popup should be open */
  openPopup?: boolean
  /** Whether the marker is draggable */
  draggable?: boolean
  /** A function that is called when the marker is dragged to a new location */
  onLngLatChange?: (lngLat: number[]) => void
  /** A function that is called when the marker's associated popup is closed */
  onClose?: () => void
  /** A function that is called when the marker starts being dragged */
  onDragStart?: () => void
  /** A function that is called when the marker stops being dragged */
  onDragEnd?: () => void
  /** The content to be displayed in the marker's associated popup */
  children?: any
}

export const Marker: Component<Props> = props => {
  if (!useMap()) return
  const [map] = useMap()
  let marker: MarkerType = null
  let popup: PopupType = null

  if (!props.lngLat) throw new Error('Marker - lngLat is required')

  // Add or Update Marker
  createEffect(() => {
    const ops = { ...props.options }
    const pops = { ...props.options?.popup }
    if (!map()) return
    const mapboxgl = map().mapLib
    untrack(() => {
      popup?.remove()
      popup = props.children
        ? new mapboxgl.Popup(pops)
            .setHTML(props.children)
            .on('close', () => props.onClose?.())
        : null

      marker?.remove()
      marker = new mapboxgl.Marker(ops)
        .setPopup(popup)
        .on('dragstart', () => props.onDragStart?.())
        .on('dragend', () => props.onDragEnd?.())
        .on('drag', () => props.onLngLatChange?.(marker.getLngLat().toArray()))
        .setDraggable(props.draggable || props.options?.draggable)
        .setLngLat(props.lngLat)
        .addTo(map())
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
