import {
  onCleanup,
  createSignal,
  createEffect,
  VoidComponent,
  untrack,
} from 'solid-js'
import { useMapContext } from '../MapProvider'
import type { StyleImageInterface, Map as MapboxMap } from 'mapbox-gl'
import { toSDF, sdfPadding, type SDFOptions } from './sdf'
import {
  PATTERN,
  patternList,
  SYMBOL,
  symbolList,
  wrapSymbolPath,
  type PatternName,
  type SymbolName,
} from './shapes'

// `StyleImageMetadata` isn't part of mapbox-gl's public type exports; derive it structurally
// from `addImage`'s own options parameter instead of depending on an internal type name.
type StyleImageMetadata = NonNullable<Parameters<MapboxMap['addImage']>[2]>

export { patternList, symbolList }

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
    type: PatternName | (string & {})
    color: Color
    background: Color
    lineWidth: number
  }
  /** The pattern to be used for the image component. */
  /** A predefined icon shape (see `symbolList`, e.g. `"triangle"`, `"hexagon"`), full custom
   *  SVG markup, or a raw SVG path `d` string. Resolved the same way `source` is — including
   *  `sdf` and `options.fill`/`options.stroke` — so it's just a convenient way to pick a
   *  built-in shape instead of writing the markup yourself. Ignored if `source` is set. */
  symbol?: SymbolName | (string & {})
  /** Convert the rasterized source into a real signed-distance-field bitmap (not just
   *  tagged with `sdf: true`), so `icon-color`/`icon-halo-color`/`icon-halo-width`/
   *  `icon-halo-blur` can recolor and outline it crisply from layer paint properties.
   *  Only applies to `source`/`symbol`, not `pattern`. */
  sdf?: boolean | SDFOptions
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
    if (!props.source && !props.pattern && !props.symbol)
      throw new Error('Image - Image, Pattern or Symbol is required')

    // Match the screen's actual pixel density (same convention as `Source`'s `{r}` -> `@2x`
    // handling) instead of hard-coding 2, so patterns render crisply on both standard and
    // high-DPI (including 3x) screens without being needlessly oversized on standard ones.
    const pixelRatio = Math.max(1, Math.round(window.devicePixelRatio || 2))
    const ops = props.pattern
      ? { pixelRatio, ...props.options }
      : props.sdf
        ? { ...props.options, sdf: true }
        : props.options

    const symbolSource =
      props.symbol &&
      (SYMBOL[props.symbol] ||
        (props.symbol.trimStart().startsWith('<svg')
          ? props.symbol
          : wrapSymbolPath(props.symbol)))

    _loadImage(props.source || symbolSource || _createPattern(props.pattern, pixelRatio), (data, autoPixelRatio) => {
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
    const sdfOpts: SDFOptions | null = props.sdf
      ? typeof props.sdf === 'object'
        ? props.sdf
        : {}
      : null
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
          // reach the 50px floor; the other is scaled by the same amount to match. Guarded
          // against a 0-sized image (e.g. a broken/never-decoded source) so that doesn't divide
          // out to `Infinity` and NaN the canvas dimensions below.
          const minAxis = Math.min(img.width, img.height)
          const floorScale = minAxis > 0 ? Math.max(1, 50 / minAxis) : 1
          const pixelRatio =
            props.options?.pixelRatio ??
            Math.max(1, Math.round(window.devicePixelRatio || 1))
          // The `floorScale` oversampling above is purely for raster crispness on tiny source
          // art — it must be folded into the reported ratio alongside `pixelRatio`, or mapbox
          // displays the image at `floorScale` times its authored CSS size instead of an
          // un-oversampled render's size (the whole point of reporting a ratio back at all).
          const scale = floorScale * pixelRatio
          // SDF needs empty margin around the art for the outward halo gradient to fade into —
          // without it, the distance field clips hard at the bitmap edge. Scaled by the full
          // `scale` (not just `pixelRatio`) to match: `toSDF`'s `radius` is a fixed number of
          // *canvas* pixels, and the canvas itself is oversampled by `scale`, so the margin has
          // to grow with it to keep the gradient's on-map CSS width constant.
          const padding = sdfOpts ? sdfPadding(sdfOpts) * scale : 0
          const drawWidth = Math.round(img.width * scale)
          const drawHeight = Math.round(img.height * scale)
          const canvas = document.createElement('canvas')
          canvas.width = drawWidth + padding * 2
          canvas.height = drawHeight + padding * 2
          const ctx = canvas.getContext('2d')
          ctx.imageSmoothingEnabled = true
          ctx.drawImage(img, padding, padding, drawWidth, drawHeight)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          return callback(
            sdfOpts ? toSDF(imageData, sdfOpts) : imageData,
            scale
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
        if (!sdfOpts) return callback(imageData)
        // mapbox-gl's loadImage callback can hand back an ImageBitmap (no `.data`, so not
        // usable as PixelData directly) as readily as an ImageData — and either way, the SDF
        // transform needs the same empty margin the img.onload branch above pads in, or the
        // field clips hard at the bitmap edge (see sdf.ts's own sdfPadding comment).
        const { width, height } = imageData
        const padding = sdfPadding(sdfOpts)
        const canvas = document.createElement('canvas')
        canvas.width = width + padding * 2
        canvas.height = height + padding * 2
        const c = canvas.getContext('2d')
        c.imageSmoothingEnabled = true
        if ('data' in imageData) {
          c.putImageData(imageData, padding, padding)
        } else {
          c.drawImage(imageData, padding, padding, width, height)
        }
        const pixels = c.getImageData(0, 0, canvas.width, canvas.height)
        return callback(toSDF(pixels, sdfOpts))
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
        this.ctx.lineWidth = pattern.lineWidth || 1
        this.ctx.stroke(new Path2D(p.path))
        if (p.fill) this.ctx.fill(new Path2D(p.path))
        this.data = this.ctx.getImageData(0, 0, this.width, this.height).data
        return true
      },
    }
  }

  return null
}
