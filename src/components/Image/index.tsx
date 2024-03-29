import {
  onCleanup,
  createSignal,
  createEffect,
  VoidComponent,
  untrack,
} from 'solid-js'
import { useMapContext } from '../MapProvider'
import type {
  StyleImageInterface,
  StyleImageMetadata,
} from 'mapbox-gl/src/style/style_image'

const PATTERN = {
  diagonal_l: { size: 20, path: 'M20 0 0 20M-10 10 10-10M10 30 30 10' },
  diagonal_r: { size: 20, path: 'M0 0 20 20M30 10 10-10M10 30-10 10' },
  horizontal: { size: 14, path: 'M7 0V20' },
  vertical: { size: 14, path: 'M0 7H20' },
  cross: { size: 18, path: 'M9 0V18M0 9H18' },
  hash: { size: 30, path: 'M15 0 30 15 15 30 0 15Z' },
  chevron_h: { size: 20, path: 'M-5 5 0 10 10 0 20 10 25 5M0 30 10 20 20 30' },
  chevron_v: { size: 20, path: 'M5-5 10 0 0 10 10 20 5 25M25 15 20 10 25 5' },
  square: { size: 20, path: 'M8 8H12V12H8Z', fill: true },
  hex: { size: 50, path: 'M0 0V50L50 25ZM50 0V50L0 25ZM25 0V50' },
  circle: {
    size: 25,
    path: 'M8 10A2.5 2.5 0 118.01 10M18 15A2.5 2.5 0 1018.01 15',
    fill: true,
  },
}

export const patternList = Object.keys(PATTERN)

export type Color =
  | `#${string}`
  | `rgb(${number}, ${number}, ${number})`
  | `rgba(${number}, ${number}, ${number}, ${number})`
  | `hsl(${number}, ${number}%, ${number}%)`
  | `hsla(${number}, ${number}%, ${number}%, ${number})`

type Props = {
  id: string
  /** The unique identifier for the image. */
  source?:
  | HTMLImageElement
  | ImageBitmap
  | ImageData
  | SVGElement
  | { width: number; height: number; data: Uint8Array | Uint8ClampedArray }
  | StyleImageInterface
  | string
  /** The image to be used for the image component. */
  options?: StyleImageMetadata & {
    fill?: Color
    stroke?: Color
    transform?: string
  }
  /**  The options for the image */
  pattern?: {
    type: string
    color: Color
    background: Color
    lineWith: number
  }
  /** The pattern to be used for the image component. */
}

export const MGL_Image: VoidComponent<Props> = props => {
  const [ctx] = useMapContext()
  const [size, setSize] = createSignal({ width: 0, height: 0 })

  const debug = (text, value?) => {
    ctx.map.debug &&
      console.debug('%c[MapGL]', 'color: #10b981', text, value || '')
  }

  // Remove Image
  onCleanup(() => {
    ctx.map?.hasImage(props.id) && ctx.map?.removeImage(props.id)
    debug('Remove Image:', props.id)
  })

  // Add or Update Image
  createEffect(() => {
    if (!props.id) throw new Error('Image - ID is required')
    if (!props.source && !props.pattern)
      throw new Error('Image - Image or Pattern is required')

    const ops = props.pattern
      ? { pixelRatio: 2, ...props.options }
      : props.options

    _loadImage(props.source || _createPattern(props.pattern), data => {
      const { width, height } = data
      if (ctx.map && !ctx.map.hasImage(props.id))
        ctx.map.addImage(props.id, data, ops)
      if (
        !props.pattern &&
        untrack(() => width === size().width && height === size().height)
      ) {
        ctx.map.updateImage(props.id, data)
        ctx.map.triggerRepaint()
      } else {
        ctx.map.removeImage(props.id)
        ctx.map.addImage(props.id, data, ops)
      }
      setSize({ width, height })
      debug('Add Image:', props.id)
      ctx.map.on('style.load', () => {
        if (ctx.map.hasImage(props.id)) return
        ctx.map.addImage(props.id, data, ops)
        debug('Re-Add Image:', props.id)
      })
    })
  })

  // Load Image / SVG
  const _loadImage = (image, callback) => {
    if (typeof image == 'string' && image?.trimStart().startsWith('<svg')) {
      image = new DOMParser().parseFromString(image, 'image/svg+xml')
        .childNodes[0]
    }
    if (image instanceof SVGElement) {
      props.options?.fill && image.setAttribute('fill', props.options.fill)
      props.options?.stroke &&
        image.setAttribute('stroke', props.options.stroke)
      image = new XMLSerializer().serializeToString(image)
    }
    if (typeof image !== 'string') return callback(image)
    ctx.map.loadImage(image, async (error, imageData) => {
      if (error) {
        if (typeof image == 'string' && image?.trimEnd().endsWith('.svg')) {
          image = await (await fetch(image)).text()
          image = new DOMParser().parseFromString(image, 'image/svg+xml')
            .childNodes[0]
          image.setAttribute('fill', props.options.fill)
          image.setAttribute('stroke', props.options.stroke)
          image.setAttribute('transform', props.options.transform)
          image = new XMLSerializer().serializeToString(image)
        }
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = Math.max(img.width, 50)
          canvas.height = Math.max(img.height, 50)
          const ctx = canvas.getContext('2d')
          ctx.imageSmoothingEnabled = true
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          return callback(ctx.getImageData(0, 0, canvas.width, canvas.height))
        }
        img.src = image.trimStart().startsWith('<svg')
          ? 'data:image/svg+xml;charset=utf-8,' + image
          : image
      } else {
        return callback(imageData)
      }
    })
  }

  const _createPattern = pattern => {
    const p = PATTERN[pattern.type]
    return {
      width: p.size,
      height: p.size,
      data: new Uint8Array(p.size * p.size * 4),
      onAdd: function () {
        let canvas = document.createElement('canvas')
        canvas.width = canvas.height = p.size
        this.ctx = canvas.getContext('2d', { willReadFrequently: true })
      },
      render: function () {
        this.ctx.fillStyle = pattern.background || 'transparent'
        this.ctx.fillRect(0, 0, this.width, this.height)
        this.ctx.strokeStyle = this.ctx.fillStyle = pattern.color || 'black'
        this.ctx.lineWidth = pattern.lineWith || 1
        this.ctx.stroke(new Path2D(p.path))
        if (p.fill) this.ctx.fill(new Path2D(p.path))
        this.data = this.ctx.getImageData(0, 0, this.width, this.height).data
        return true
      },
    }
  }

  return null
}
