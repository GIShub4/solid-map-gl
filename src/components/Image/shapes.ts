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

const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">${body}</svg>`

// Filled with a solid, overridable default (`options.fill`/`options.stroke` on `<Image>` patch
// these same attributes) so every symbol renders sensibly even without `sdf` or a custom color.
// Each shape fills a generous ~87% of the 64x64 viewBox on its tightest axis, leaving enough
// margin that a moderate `sdf` halo doesn't touch the art itself.
export const SYMBOL: Record<string, string> = {
  square: svg('<rect x="8" y="8" width="48" height="48" fill="#000"/>'),
  circle: svg('<circle cx="32" cy="32" r="28" fill="#000"/>'),
  triangle: svg('<polygon points="32,6 60,56 4,56" fill="#000"/>'),
  diamond: svg('<polygon points="32,4 60,32 32,60 4,32" fill="#000"/>'),
  pentagon: svg('<polygon points="32,4 59,23 48,55 16,55 5,23" fill="#000"/>'),
  hexagon: svg('<polygon points="32,4 56,18 56,46 32,60 8,46 8,18" fill="#000"/>'),
  // A square with corners cut at 2/7 of its side, the standard construction for a regular
  // octagon (stop-sign proportions) without resorting to trig.
  octagon: svg(
    '<polygon points="20,4 44,4 60,20 60,44 44,60 20,60 4,44 4,20" fill="#000"/>'
  ),
  cross: svg(
    '<polygon points="20,4 44,4 44,20 60,20 60,44 44,44 44,60 20,60 20,44 4,44 4,20 20,20" fill="#000"/>'
  ),
  // The same 12-point "+" as `cross` above, rotated 45° about the center.
  x: svg(
    '<polygon points="43,4 60,21 49,32 60,43 43,60 32,49 21,60 4,43 15,32 4,21 21,4 32,15" fill="#000"/>'
  ),
  // A regular 5-pointed star: outer vertices every 72° (radius 30) alternating with inner
  // vertices every 72° offset by 36° (radius ~11.5, the usual ratio for a balanced star).
  star: svg(
    '<polygon points="32,2 39,23 61,23 43,36 50,56 32,44 14,56 21,36 4,23 25,23" fill="#000"/>'
  ),
}

export const symbolList = Object.keys(SYMBOL)
export type SymbolName = keyof typeof SYMBOL

/** A raw SVG path's `d` data, wrapped in the same 64x64 viewBox template the built-in
 *  `SYMBOL` shapes use, so a hand-authored path composes the same way they do. */
export const wrapSymbolPath = (d: string) => svg(`<path d="${d}" fill="#000"/>`)
