import { onMount, onCleanup, createEffect, Component } from 'solid-js'
import { useMap } from '../MapGL'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type {
  StyleImageInterface,
  StyleImageMetadata,
} from 'mapbox-gl/src/style/style_image'

const Image: Component<{
  id: string
  url?: string
  image?:
    | HTMLImageElement
    | ImageBitmap
    | ImageData
    | { width: number; height: number; data: Uint8Array | Uint8ClampedArray }
    | StyleImageInterface
  options?: StyleImageMetadata
}> = props => {
  const map: MapboxMap = useMap()
  // Add Image
  onMount(async () => {
    !map().isStyleLoaded() && (await map().once('styledata'))
    if (props.url) {
      map().loadImage(props.url, (error, image) => {
        if (error) throw error
        !map().hasImage(props.id) && map().addImage(props.id, image)
      })
    } else {
      !map().hasImage(props.id) &&
        map().addImage(props.id, props.image, props.options)
    }
  })
  // Remove Image
  onCleanup(() => map().hasImage(props.id) && map().removeImage(props.id))

  // Update Image
  createEffect(async () => {
    if (props.image && props.url) return

    if (props.url) {
      map().loadImage(props.url, (error, image) => {
        if (error) throw error
        !map().hasImage(props.id) && map().updateImage(props.id, image)
      })
    } else {
      map().style &&
        map().hasImage(props.id) &&
        map().updateImage(props.id, props.image)
    }
  })

  return <></>
}

export default Image
