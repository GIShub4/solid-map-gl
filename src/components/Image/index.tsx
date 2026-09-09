import {
  onCleanup,
  createSignal,
  createEffect,
  VoidComponent,
  untrack,
} from 'solid-js'
import { useMapContext } from '../MapProvider'
import type { StyleImageInterface, Map as MapboxMap } from 'mapbox-gl'

// `StyleImageMetadata` isn't part of mapbox-gl's public type exports; derive it structurally
// from `addImage`'s own options parameter instead of depending on an internal type name.
type StyleImageMetadata = NonNullable<Parameters<MapboxMap['addImage']>[2]>

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
  // Snapshot of the last successfully-loaded image, used to re-register it after a
  // wholesale style swap (`setStyle()`), which wipes all previously-added images.
  let latestImage: {
    data: Parameters<MapboxMap['addImage']>[1]
    ops: StyleImageMetadata
  } | null = null

  const debug = (text, value?) => {
    ctx.map.debug &&
      console.debug('%c[MapGL]', 'color: #10b981', text, value || '')
  }

  // A new style has no knowledge of images registered on the previous one, so re-add ours
  // once the new style finishes loading. Registered once (not per-effect-run) so it doesn't
  // accumulate duplicate listeners across reactive updates.
  const handleStyleLoad = () => {
    if (!latestImage || !ctx.map || ctx.map.hasImage(props.id)) return
    ctx.map.addImage(props.id, latestImage.data, latestImage.ops)
    debug('Re-Add Image:', props.id)
  }
  ctx.map.on('style.load', handleStyleLoad)

  // Remove Image
  onCleanup(() => {
    ctx.map?.off('style.load', handleStyleLoad)
    ctx.map?.hasImage(props.id) && ctx.map?.removeImage(props.id)
    debug('Remove Image:', props.id)
  })

  // Add or Update Image
  createEffect(() => {
    if (!props.id) throw new Error('Image - ID is required')
    if (!props.source && !props.pattern)
      throw new Error('Image - Image or Pattern is required')

    // Match the screen's actual pixel density (same convention as `Source`'s `{r}` -> `@2x`
    // handling) instead of hard-coding 2, so patterns render crisply on both standard and
    // high-DPI (including 3x) screens without being needlessly oversized on standard ones.
    const pixelRatio = Math.max(1, Math.round(window.devicePixelRatio || 2))
    const ops = props.pattern
      ? { pixelRatio, ...props.options }
      : props.options

    _loadImage(props.source || _createPattern(props.pattern, pixelRatio), (data, autoPixelRatio) => {
      // The SVG-rasterization fallback below reports the pixelRatio it actually rendered
      // at (`autoPixelRatio`) so mapbox displays it at the pre-oversampling CSS size instead
      // of the raw oversampled pixel size.
      const finalOps = autoPixelRatio ? { ...ops, pixelRatio: autoPixelRatio } : ops
      const { width, height } = data
      if (ctx.map && !ctx.map.hasImage(props.id))
        ctx.map.addImage(props.id, data, finalOps)
      if (
        !props.pattern &&
        untrack(() => width === size().width && height === size().height)
      ) {
        ctx.map.updateImage(props.id, data)
        ctx.map.triggerRepaint()
      } else {
        ctx.map.removeImage(props.id)
        ctx.map.addImage(props.id, data, finalOps)
      }
      setSize({ width, height })
      latestImage = { data, ops: finalOps }
      debug('Add Image:', props.id)
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
    // mapbox-gl's currently-shipped implementation (verified against v3.30) still requires the
    // callback unconditionally and never returns a promise when it's omitted — the promise form
    // some docs describe isn't actually present in this version, so stay on the callback API.
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
          // Scale both axes by the same factor so a non-square source keeps its aspect ratio
          // instead of being stretched into a square canvas — only the smaller axis needs to
          // reach the 50px floor; the other is scaled by the same amount to match.
          const floorScale = Math.max(1, 50 / Math.min(img.width, img.height))
          // Honor an explicit `options.pixelRatio` (oversample to match it exactly); otherwise
          // oversample for the actual screen so the vector source rasterizes crisply, and
          // report that ratio back so the caller can tag it — keeping the on-map CSS size the
          // same as an un-oversampled render would have been.
          const pixelRatio =
            props.options?.pixelRatio ??
            Math.max(1, Math.round(window.devicePixelRatio || 1))
          const scale = floorScale * pixelRatio
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          const ctx = canvas.getContext('2d')
          ctx.imageSmoothingEnabled = true
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          return callback(
            ctx.getImageData(0, 0, canvas.width, canvas.height),
            pixelRatio
          )
        }
        // Without onerror, a data URI that fails to decode (e.g. unescaped characters below)
        // leaves the load hanging forever with no error and no image ever added.
        img.onerror = event =>
          console.error(`[MapGL] Image "${props.id}" failed to load:`, event)
        img.src = image.trimStart().startsWith('<svg')
          ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(image)
          : image
      } else {
        return callback(imageData)
      }
    })
  }

  const _createPattern = (pattern, pixelRatio = 2) => {
    const p = PATTERN[pattern.type]
    // The canvas is allocated at the physical (pixelRatio-scaled) size and drawn through a
    // scaled context, so the pattern is actually oversampled rather than just being labelled
    // with a `pixelRatio` mapbox then divides back down to the same soft image.
    const size = p.size * pixelRatio
    return {
      width: size,
      height: size,
      data: new Uint8Array(size * size * 4),
      onAdd: function () {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        this.ctx = canvas.getContext('2d', { willReadFrequently: true })
        this.ctx.scale(pixelRatio, pixelRatio)
      },
      render: function () {
        this.ctx.fillStyle = pattern.background || 'transparent'
        this.ctx.fillRect(0, 0, p.size, p.size)
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
