import { onCleanup, createEffect, Component, untrack } from 'solid-js'
import { useMapContext } from '../MapProvider'
import type { Popup as PopupType, PopupOptions, LngLatLike } from 'mapbox-gl'

type Props = {
  /** Options for configuring the popup */
  options?: PopupOptions
  /** Flag for tracking the mouse pointer */
  trackPointer?: boolean
  /** Longitude and latitude for the popup */
  lngLat?: LngLatLike
  /** Callback for when the popup is closed */
  onClose?: () => void
  /** Children to display within the popup */
  children?: any
}

export const Popup: Component<Props> = (props: Props) => {
  const [ctx] = useMapContext()
  let popup: PopupType = null

  if (!props.trackPointer && !props.lngLat)
    throw new Error('Popup - lngLat or trackPointer is required')

  // Add or Update Popup
  createEffect(() => {
    const ops = { ...props.options }
    if (!ctx.map) return
    const mapboxgl = ctx.map.mapLib
    untrack(() => {
      popup?.remove()
      popup = new mapboxgl.Popup(
        props.trackPointer
          ? { ...ops, closeOnClick: false, closeButton: false }
          : { focusAfterOpen: false, ...ops }
      )
        .setHTML(props.children || '')
        .setLngLat(props.lngLat)
        .on('close', () => props.onClose?.())
        .addTo(ctx.map)
    })
  })

  // Update Position
  createEffect(() =>
    props.trackPointer ? popup.trackPointer() : popup.setLngLat(props.lngLat)
  )

  // Update Content
  createEffect(() => popup.setHTML(props.children || ''))

  // Remove Popup
  onCleanup(() => popup?.remove())

  return null
}
