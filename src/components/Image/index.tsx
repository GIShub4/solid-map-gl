import { onCleanup, createSignal, createEffect, VoidComponent } from 'solid-js'
import { useMap } from '../MapGL'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type {
  StyleImageInterface,
  StyleImageMetadata,
} from 'mapbox-gl/src/style/style_image'

const patternList = {
  diagonal_left: { size: 30, path: 'M8 0H22L30 8V22ZM0 8 22 30H8L0 22Z' },
  diagonal_right: { size: 30, path: 'M8 0H22L0 22V8ZM30 8V22L22 30H8Z' },
  horizontal: { size: 30, path: 'M0 0H30V7.5H0ZM0 15H30V22.5H0Z' },
  vertical: { size: 30, path: 'M0 0H7.5V30H0ZM15 0H22.5V30H15Z' },
  square: { size: 30, path: 'M0 0H15V30H30V15H0Z' },
  circle: {
    size: 30,
    path: 'M8 0A1 1 0 008 16 1 1 0 008 0M22 14A1 1 0 0022 30 1 1 0 0022 14Z',
  },
  hash: {
    size: 30,
    path: 'M9 0H21L30 9V21L21 30H9L0 21V9ZM15 6.5 6.5 15 15 23.5 23.5 15Z',
  },
  cross: { size: 30, path: 'M9 0H21V9H30V21H21V30H9V21H0V9H9Z' },
  triangle: { size: 30, path: 'M15 0 30 15H0ZM0 15V30H14ZM30 15V30H14Z' },
  star: {
    size: 30,
    path: 'M15 0 18 12 30 12 20 19 23 30 15 22 7 30 10 19 0 12 12 12Z',
  },
  hexagon: { size: 30, path: 'M12 5 5 12V18L12 25H18L25 18V12L18 5Z' },
}

export const patterns = Object.keys(patternList)

type Color =
  | `#${string}`
  | `rgb(${number}, ${number}, ${number})`
  | `hsl(${number}, ${number}%, ${number}%)`

export const Image: VoidComponent<{
  id: string
  image?:
    | HTMLImageElement
    | ImageBitmap
    | ImageData
    | { width: number; height: number; data: Uint8Array | Uint8ClampedArray }
    | StyleImageInterface
    | string
  options?: StyleImageMetadata
  pattern?: { type: string; color: Color; opacity: number; bgColor: Color }
}> = props => {
  const map: MapboxMap = useMap()()
  const [size, setSize] = createSignal({ width: 0, height: 0 })

  // Remove Image
  onCleanup(() => map && map.hasImage(props.id) && map.removeImage(props.id))

  // Add or Update Image
  createEffect(() => {
    if (!props.id) throw new Error('Image - ID is required')
    if (!props.image && !props.pattern)
      throw new Error('Image - Image or Pattern is required')

    const image = props.pattern ? _createPattern(props.pattern) : props.image

    _loadImage(image, data => {
      const { width, height } = data
      if (!map.hasImage(props.id))
        map.addImage(
          props.id,
          data,
          props.pattern ? { pixelRatio: 2, ...props.options } : props.options
        )
      if (width === size().width && height === size().height) {
        map.updateImage(props.id, data)
        map.triggerRepaint()
      } else {
        map.removeImage(props.id)
        map.addImage(
          props.id,
          data,
          props.pattern ? { pixelRatio: 2, ...props.options } : props.options
        )
      }
      setSize({ width, height })
    })
  })

  // Load Image from URL
  const _loadImage = (image, callback) => {
    if (typeof image !== 'string') return callback(image)
    map.loadImage(image, (error, imageData) => {
      if (error) throw error
      return callback(imageData)
    })
  }

  const _createPattern = pattern => ({
    width: patternList[pattern.type].size,
    height: patternList[pattern.type].size,
    data: new Uint8Array(Math.pow(patternList[pattern.type].size, 2) * 4),
    onAdd: function () {
      var canvas = document.createElement('canvas')
      canvas.width = canvas.height = patternList[pattern.type].size
      this.ctx = canvas.getContext('2d')
    },
    render: function () {
      this.ctx.fillStyle = pattern.bgColor || 'transparent'
      this.ctx.fillRect(0, 0, size, size)
      this.ctx.fillStyle = pattern.color
      this.ctx.fillOpacity = pattern.opacity
      this.ctx.fill(new Path2D(patternList[pattern.type].path))
      this.data = this.ctx.getImageData(0, 0, this.width, this.height).data
      return true
    },
  })

  return null
}
