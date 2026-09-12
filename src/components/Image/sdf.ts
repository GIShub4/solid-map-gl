// Converts a plain rasterized (antialiased) alpha-channel bitmap into a genuine
// signed-distance-field bitmap — the same encoding mapbox-gl-js's own text renderer
// produces for glyphs, and Mapbox Studio produces for its "SDF" sprite icons. This is
// what actually lets `icon-color` / `icon-halo-color` / `icon-halo-width` /
// `icon-halo-blur` recolor and outline an icon crisply from layer paint properties at
// any size — passing `sdf: true` to `addImage` on a plain antialiased mask (what a raw
// SVG/canvas rasterization produces) only tells mapbox to *interpret* it as a distance
// field; it doesn't make it one, so halos/recoloring come out chunky or soft.
//
// The distance transform itself (`edt`/`edt1d`) is the exact Euclidean distance
// transform from Felzenszwalt & Huttenlocher, "Distance Transforms of Sampled
// Functions" (2012) — the same algorithm mapbox's own `@mapbox/tiny-sdf` uses
// internally to SDF-encode text glyphs. That package only exposes a glyph-drawing
// `draw(char)` API tied to `fillText`, not a way to run the transform on an arbitrary
// image, so the transform is reimplemented here to work on any rasterized alpha mask.

const INF = 1e20

// Maps a 0-255 alpha byte to a signed "sub-pixel" squared distance, gamma-corrected
// (1/2.2) to match how browsers alpha-blend antialiased edges, so partial-alpha
// boundary pixels contribute a fractional offset instead of snapping to a hard
// inside/outside threshold at exactly 128.
const ALPHA_TABLE = new Float64Array(256)
for (let i = 0; i < 256; i++) {
  const d = 0.5 - Math.pow(i / 255, 1 / 2.2)
  ALPHA_TABLE[i] = d * Math.abs(d)
}
ALPHA_TABLE[255] = -INF

function edt1d(
  grid: Float64Array,
  offset: number,
  stride: number,
  length: number,
  f: Float64Array,
  v: Uint16Array,
  z: Float64Array
) {
  v[0] = 0
  z[0] = -INF
  z[1] = INF
  f[0] = grid[offset]

  for (let q = 1, k = 0, s = 0; q < length; q++) {
    f[q] = grid[offset + q * stride]
    const q2 = q * q
    do {
      const r = v[k]
      s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2
    } while (s <= z[k] && --k > -1)
    k++
    v[k] = q
    z[k] = s
    z[k + 1] = INF
  }

  for (let q = 0, k = 0; q < length; q++) {
    while (z[k + 1] < q) k++
    const r = v[k]
    const qr = q - r
    grid[offset + q * stride] = f[r] + qr * qr
  }
}

function edt(
  data: Float64Array,
  width: number,
  height: number,
  f: Float64Array,
  v: Uint16Array,
  z: Float64Array
) {
  for (let x = 0; x < width; x++) edt1d(data, x, width, height, f, v, z)
  for (let y = 0; y < height; y++) edt1d(data, y * width, 1, width, f, v, z)
}

export type SDFOptions = {
  /** Pixels of gradient falloff encoded around each edge. Needs matching empty margin
   *  around the source art (see `sdfPadding`) or the field clips at the bitmap border. */
  radius?: number
  /** Where along the gradient (0-1) the shape's "true" edge sits; matches mapbox's own
   *  glyph default. */
  cutoff?: number
}

/** How much transparent margin (in output pixels) a given radius needs on every side
 *  so the outward gradient has room instead of being cut off at the bitmap edge. */
export const sdfPadding = ({ radius = 8 }: SDFOptions = {}) => Math.ceil(radius)

// Plain `{width, height, data}` rather than the real `ImageData` DOM type: mapbox's
// `addImage` already accepts this shape directly (see `Image`'s own `source` prop
// type), and building on it avoids depending on the `ImageData` constructor, which
// isn't available outside a browser/canvas context (e.g. in this repo's jsdom test
// environment).
export type PixelData = {
  width: number
  height: number
  data: Uint8Array | Uint8ClampedArray
}

export function toSDF(
  imageData: PixelData,
  { radius = 8, cutoff = 0.25 }: SDFOptions = {}
): PixelData {
  const { width, height } = imageData
  const len = width * height
  const gridOuter = new Float64Array(len).fill(INF)
  const gridInner = new Float64Array(len)
  const size = Math.max(width, height)
  const f = new Float64Array(size)
  const v = new Uint16Array(size)
  const z = new Float64Array(size + 1)

  const src = imageData.data
  for (let i = 0, j = 3; i < len; i++, j += 4) {
    const a = src[j]
    if (a === 0) continue
    const t = ALPHA_TABLE[a]
    gridOuter[i] = Math.max(0, t)
    gridInner[i] = Math.max(0, -t)
  }

  edt(gridOuter, width, height, f, v, z)
  edt(gridInner, width, height, f, v, z)

  const scale = 255 / radius
  const base = 255 * (1 - cutoff)
  const out = new Uint8ClampedArray(len * 4)
  for (let i = 0, j = 0; i < len; i++, j += 4) {
    const d = Math.sqrt(gridOuter[i]) - Math.sqrt(gridInner[i])
    const value = Math.max(0, Math.min(255, Math.round(base - scale * d)))
    out[j] = out[j + 1] = out[j + 2] = 255
    out[j + 3] = value
  }
  return { width, height, data: out }
}
