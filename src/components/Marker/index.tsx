import { onCleanup, createEffect, Component, splitProps } from 'solid-js'
import { useMapContext } from '../MapProvider'
import type {
  Popup as PopupType,
  PopupOptions,
  Marker as MarkerType,
  MarkerOptions,
  LngLatLike,
} from 'mapbox-gl'

type Props = {
  /** The geographical location to place the marker */
  lngLat: LngLatLike
  /** Options for the Mapbox GL JS marker */
  options?: MarkerOptions
  /** Options for the Mapbox GL JS popup that is associated with the marker */
  popup?: PopupOptions
  /** Whether the marker's associated popup should be open */
  showPopup?: boolean
  /** Whether the marker is draggable */
  draggable?: boolean
  /** A function that is called when the marker's associated popup is opened */
  onOpen?: () => void
  /** A function that is called when the marker's associated popup is closed */
  onClose?: () => void
  /** A function that is called when the marker starts being dragged */
  onDragStart?: () => void
  /** A function that is called when the marker stops being dragged */
  onDragEnd?: () => void
  /** A function that is called when the marker is being dragged */
  onDrag?: (lngLat: number[]) => void
  /** The content to be displayed in the marker's associated popup */
  children?: any
}

export const Marker: Component<Props> = (props: Props) => {
  if (!props.lngLat) throw new Error('Marker - lngLat is required')
  const [update, create_popup, create_marker] = splitProps(
    props,
    ['lngLat', 'children', 'showPopup', 'draggable'],
    ['popup', 'onOpen', 'onClose']
  )

  const [ctx] = useMapContext()
  let marker: MarkerType = null
  let popup: PopupType = null
  const LNGLAT = update.lngLat

  // Add or Update Popup
  createEffect(() => {
    if (!ctx.map) return
    popup?.remove()
    popup = new window.MapLib.Popup({
      closeOnClick: false,
      focusAfterOpen: false,
      ...create_popup.popup,
    })
      .on('open', () => create_popup.onOpen?.())
      .on('close', () => create_popup.onClose?.())

    // Update Popup Content
    createEffect(() => {
      if (update.children === undefined) return
      typeof update.children === 'string'
        ? popup?.setHTML(update.children)
        : popup?.setDOMContent(update.children)
      marker?.setPopup(popup)
    })

    // Toggle Popup
    createEffect(
      () => update.showPopup !== popup?.isOpen() && marker?.togglePopup()
    )
  })

  // Add or Update Marker
  createEffect(() => {
    if (!ctx.map) return
    marker?.remove()
    marker = new window.MapLib.Marker(create_marker.options)
      .on('dragstart', () => create_marker.onDragStart?.())
      .on('dragend', () => create_marker.onDragEnd?.())
      .on('drag', () => create_marker.onDrag?.(marker?.getLngLat().toArray()))
      .setPopup(popup)
      .setLngLat(LNGLAT)
      .addTo(ctx.map)

    // Toggle Popup
    createEffect(
      () => update.showPopup !== popup?.isOpen() && marker?.togglePopup()
    )
  })

  // Update Position
  createEffect(() => marker?.setLngLat(update.lngLat))

  // Update Draggable
  createEffect(() => marker?.setDraggable(update.draggable))

  // Remove Marker
  onCleanup(() => marker?.remove())

  return null
}
