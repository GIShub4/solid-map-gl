// Built-in vector art for `<Image>`'s two shape-related props:
//
// - `PATTERN` (via the `pattern` prop) is tileable line/hatch art meant to repeat as a
//   `fill-pattern` background — drawn procedurally onto a canvas every frame via a
//   `StyleImageInterface`'s `onAdd`/`render` (see `_createPattern` in `index.tsx`), so its
//   `color`/`background`/`lineWidth` can change without recreating the image. It deliberately
//   isn't SDF-able: its `background` is normally opaque, which breaks the inside/outside
//   silhouette assumption an SDF's alpha channel depends on.
// - `SYMBOL` (via the `symbol` prop) is single, full-bleed icon markup meant for `icon-image`
//   on point features — plain SVG strings, rasterized the same way a hand-authored custom SVG
//   `source` would be, so they work with `sdf` for data-driven `icon-color`/`icon-halo-*`.
//
// Both are collected here (rather than each having its own file) since they're the same kind
// of thing — a named lookup table backing a convenience prop — and browsing them side by side
// makes the line between "tileable pattern" and "discrete symbol" easier to see.

export type Pattern = { size: number; path: string; fill?: boolean }

export const PATTERN: Record<string, Pattern> = {
  diagonal_l: { size: 20, path: 'M20 0 0 20M-10 10 10-10M10 30 30 10' },
  diagonal_r: { size: 20, path: 'M0 0 20 20M30 10 10-10M10 30-10 10' },
  horizontal: { size: 14, path: 'M7 0V20' },
  vertical: { size: 14, path: 'M0 7H20' },
  // A single centered "+" per tile, tiling into a repeating grid of crosses — not to be
  // confused with `SYMBOL.cross` (a single bold "+" icon) below.
  cross: { size: 18, path: 'M9 0V18M0 9H18' },
  hash: { size: 30, path: 'M15 0 30 15 15 30 0 15Z' },
  chevron_h: { size: 20, path: 'M-5 5 0 10 10 0 20 10 25 5M0 30 10 20 20 30' },
  chevron_v: { size: 20, path: 'M5-5 10 0 0 10 10 20 5 25M25 15 20 10 25 5' },
  square: { size: 20, path: 'M8 8H12V12H8Z', fill: true },
  hex: { size: 50, path: 'M0 0V50L50 25ZM50 0V50L0 25ZM25 0V50' },
  // Two arcs swept almost all the way around (`A2.5 2.5 0 1 1 ...` to a point a hair past the
  // start) rather than a `<circle>`, since this path is later stroked/filled via `Path2D`,
  // which has no dedicated circle primitive. A single dot per tile — not to be confused with
  // `SYMBOL.circle` (a single full-bleed circle icon) below.
  circle: {
    size: 25,
    path: 'M8 10A2.5 2.5 0 118.01 10M18 15A2.5 2.5 0 1018.01 15',
    fill: true,
  },
  // `horizontal` and `vertical` combined into one crossed-line tile.
  grid: { size: 20, path: 'M10 0V20M0 10H20' },
  // Two rows of offset (running-bond) bricks per tile, so the offset continues correctly
  // when tiles stack — row two's joints fall at the quarter-points, not centered, to match
  // a real brick course rather than just checkerboarding.
  brick: {
    size: 40,
    path: 'M0 0H40M0 20H40M0 40H40M0 0V20M20 0V20M40 0V20M10 20V40M30 20V40',
  },
  // Two wavy horizontal lines per tile (quadratic-bezier "hump" repeated via the `T` shorthand),
  // for the wave/water fill texture common in geologic and land-cover maps.
  wave: { size: 20, path: 'M0 5Q5 0 10 5T20 5M0 15Q5 10 10 15T20 15' },
}

export const patternList = Object.keys(PATTERN)
export type PatternName = keyof typeof PATTERN

// `viewBox`/`width`/`height` are all the same 24 units — no separate large authoring space
// scaled down for display — so 1 unit below is 1 on-map CSS px at `icon-size: 1`. 24px matches
// the typical point-marker size (Maki icon convention) so `icon-size: 1` is usable directly
// instead of needing a small multiplier that eats into `icon-halo-width` headroom — see the
// `icon-halo-width`/`icon-size` ceiling note in `Image/README.md`'s SDF section. Padding for the
// SDF halo's outward gradient is *not* this margin's job — `_loadImage` in `index.tsx` already
// pads the rasterized canvas by `sdfPadding(radius)` before running `toSDF`, independent of
// whatever margin a source SVG does or doesn't have — so there's no need to bake extra empty
// space into the viewBox for halo room.
// `stroke-linecap`/`stroke-linejoin: round` here are what make every shape below look
// rounded — each shape is plain straight-line `M`/`L`/`Z` path data (no curve commands), kept
// hand-editable on purpose, with a `stroke` in the *same* color as its `fill` and thick enough
// that its round joins visibly bevel every vertex. The rounding is this stroke trick, not curved
// path data: to change how round a shape's corners look, change its `stroke-width`, not its `d`.
const svg = (path: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" stroke-linecap="round" stroke-linejoin="round">
    <path d="${path}" fill="#000" stroke="#000" stroke-width="3"/>
  </svg>`

// Filled with a solid, overridable default (`options.fill`/`options.stroke` on `<Image>` patch
// these same attributes) so every symbol renders sensibly even without `sdf` or a custom color.
// Path coordinates stay within roughly 3-21 (a 3-unit margin on all sides of the 24 viewBox) so
// that margin can absorb the `stroke-width="3"` round join's own 1.5-unit half-width without any
// vertex's rounded corner reaching — and being clipped at — the viewBox boundary. Most shapes
// below are straight `M`/`L`/`Z` polygons; `heart`/`pin`/`drop` (and `circle`) use `A` (arc)
// commands instead, since they're genuinely round rather than round-*cornered* — the stroke
// trick only bevels individual vertices, it can't stand in for an actual circular curve.
export const SYMBOL: Record<string, string> = {
  square: svg('M3,3 L21,3 L21,21 L3,21 Z'),
  // Two semicircular arcs sharing one center/radius, traced in the same direction both times
  // (the standard "circle via two arcs" trick). The requested `1,1` radius is far smaller than
  // half the 16-unit chord between the two points, so per the SVG spec it's scaled up to the
  // minimum radius that can still connect them (8, i.e. exactly a semicircle each) — the circle
  // ends up centered on the chord's midpoint (12,11), not on the literal "1".
  circle: svg('M 12 4 A 1 1 0 0 0 12 20 A 1 1 0 0 0 12 4 Z'),
  triangle: svg('M 12 2 L 22 19 H 2 Z'),
  diamond: svg('M 12 1 L 19 12 L 12 23 L 5 12 Z'),
  pentagon: svg('M12,3 L21,9 L17,19 L7,19 L3,9 Z'),
  hexagon: svg('M12,3 L20,7.5 L20,16.5 L12,21 L4,16.5 L4,7.5 Z'),
  // A square with corners cut at 2/7 of its side, the standard construction for a regular
  // octagon (stop-sign proportions) without resorting to trig.
  octagon: svg('M 8 3 Q 12 3.3 16 3 Q 18.3 5.7 21 8 Q 20.7 12 21 16 Q 18.3 18.3 16 21 Q 12 20.7 8 21 Q 5.8 18.2 3 16 Q 3.3 12 3 8 Q 5.7 5.7 8 3 Z'),
  cross: svg('M 10.5 3 h 3 v 7.5 h 7.5 v 3 h -7.5 v 7.5 h -3 v -7.5 h -7.5 v -3 h 7.5 Z'),
  // The same 12-point "+" as `cross` above, rotated 45° about the center.
  x: svg('M 18 4 L 20 6 L 14 12 L 20 18 L 18 20 L 12 14 L 6 20 L 4 18 L 10 12 L 4 6 L 6 4 L 12 10 Z'),
  // A regular 5-pointed star: outer vertices every 72° alternating with inner vertices every
  // 72° offset by 36° (inner radius ~40% of the outer radius, the usual ratio for a balanced star).
  star: svg('M12,3 L14,9 L20.5,9 L15.5,13 L17.5,19.5 L12,15.5 L6.5,19.5 L8.5,13 L3.5,9 L10,9 Z'),
  // Two circular lobes (centers 8.5,8 / 15.5,8, radius 4.5 apart enough to overlap) joined by
  // straight tangent lines down to a bottom point. The notch between the lobes is the two
  // circles' actual intersection point (computed, not eyeballed), so both arcs land on it
  // exactly with no seam.
  heart: svg('M 12 21 L 3 11 A 4.5 4.5 0 1 1 11 8 L 13 8 A 4.5 4.5 0 1 1 21 11 Z'),
  // A map-pin/teardrop: a circle (center 12,10, r6) with two lines tangent to it converging on a
  // point below, so the straight edges meet the round top without a kink — the tangent points
  // and angles come from `acos(r / distance-to-point)`, not eyeballing.
  pin: svg('M 12 21 L 7 11 A 6 6 0 0 1 12 2 A 6 6 0 0 1 17 11 Z'),
  // The same tangent-circle construction as `pin`, just with the circle bigger relative to how
  // far below it the point sits (r6/d11 there vs r7.5/d10.5 here) — a shorter, wider point on a
  // rounder body: "a circle with one pointy edge" rather than a full elongated marker.
  drop: svg('M 4 21 V 12 A 7.5 7.5 0 0 1 12 4 A 7.5 7.5 0 0 1 13 21 Z'),
  // A thick chevron/bracket built as a filled ribbon, not a stroked open line: the outer and
  // inner edges of a constant-width "V", offset perpendicular to each arm and mitered where the
  // arms meet (both at the outer point and the inner notch). Has to be a closed silhouette like
  // every other symbol here, since `sdf` only encodes a filled alpha shape, not a stroke.
  chevron: svg('M 8 4 L 14 12 L 8 20 H 5 L 11 12 L 5 4 Z'),
}

export const symbolList = Object.keys(SYMBOL)
export type SymbolName = keyof typeof SYMBOL

/** A raw SVG path's `d` data, wrapped in the same 24x24 viewBox template the built-in
 *  `SYMBOL` shapes use, so a hand-authored path composes the same way they do. */
export const wrapSymbolPath = (d: string) => svg(d)
