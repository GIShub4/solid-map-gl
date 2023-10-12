import { onCleanup, createEffect, Component, splitProps } from 'solid-js'
import { useMapContext } from '../MapProvider'
import type { Popup as PopupType, PopupOptions, LngLatLike } from 'mapbox-gl'

type Props = {
  /** Options for configuring the popup */
  options?: PopupOptions
  /** Flag for tracking the mouse pointer */
  trackPointer?: boolean
  /** Longitude and latitude for the popup */
  lngLat?: LngLatLike
  /** Callback for when the popup is opened */
  onOpen?: () => void
  /** Callback for when the popup is closed */
  onClose?: () => void
  /** Children to display within the popup */
  children?: any
}

export const Popup: Component<Props> = (props: Props) => {
  if (!props.trackPointer && !props.lngLat)
    throw new Error('Popup - lngLat or trackPointer is required')

  const [update, create] = splitProps(props, [
    'lngLat',
    'children',
    'trackPointer',
  ])
  const [ctx] = useMapContext()
  let popup: PopupType | undefined

  // Update Popup
  createEffect(() => {
    if (!ctx.map) return
    popup?.remove()
    popup = new window.MAPLIB.Popup({
      closeOnClick: false,
      focusAfterOpen: false,
      ...create.options,
    })
      .on('open', () => create.onOpen?.())
      .on('close', () => create.onClose?.())
      .addTo(ctx.map)

    // Update Position
    createEffect(() =>
      update.trackPointer
        ? popup.trackPointer()
        : popup.setLngLat(update.lngLat)
    )

    // Update Content
    createEffect(() =>
      typeof update.children === 'string'
        ? popup.setHTML(update.children)
        : popup.setDOMContent(update.children)
    )
  })

  // Remove Popup
  onCleanup(() => popup?.remove())

  return null
}
