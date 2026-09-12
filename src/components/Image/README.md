---
description: Image Component
---

# Image

## Props

| Name     | Type                                                                                                                         | Description                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| id\*     | string                                                                                                                       | ID to reference image in layer style                                                                        |
| source\* | [HTMLImageElement, SVGElement, ImageBitmap, ImageData](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addimage) \| string | ImageBitmap or [Loadable Image URL](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#loadimage)            |
| options  | object or { stroke \| fill \| transform }                                                                                    | [Add image options](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addimage) or overwrite SVG properties |
| symbol   | one of `symbolList` (e.g. `"triangle"`) \| SVG markup \| SVG path `d` string                                                 | Predefined or custom icon shape (see [Predefined symbols](#predefined-symbols) below). Ignored if `source` is set. |
| sdf      | boolean \| { radius?: number; cutoff?: number }                                                                              | Convert `source`/`symbol` into a real signed-distance-field icon (see [SDF icons](#sdf-icons) below). Not applied to `pattern`. |

_\*required_

## Predefined symbols

`symbol` picks one of a small set of built-in point-icon shapes (`symbolList`: `square`,
`circle`, `triangle`, `diamond`, `pentagon`, `hexagon`, `octagon`, `cross`, `x`, `star`)
without you having to hand-author the SVG markup:

```jsx
<Image id="triangle" symbol="triangle" sdf />
```

You're not limited to the built-ins — `symbol` also accepts full custom SVG markup, or just
a raw path's `d` data (wrapped in the same 64×64 `viewBox` template the built-ins use), so
it's a drop-in convenience rather than a separate system from `source`:

```jsx
{/* equivalent to the built-in "triangle" symbol, just written as raw path data */}
<Image id="triangle-2" symbol="M32 6 60 56 4 56Z" sdf />
<Image id="logo" symbol={myCompanyLogoSvgString} sdf />
```

Everything under [SDF icons](#sdf-icons) and [SVG sources](#svg-sources) below applies to
`symbol` exactly as it does to a hand-authored SVG passed to `source` — it's resolved to
markup and rasterized the same way. `pattern` is a separate, older mechanism for tileable
`fill-pattern` hatch/line textures (see `patternList`) rather than discrete point icons —
reach for `symbol`/`source`, not `pattern`, for anything you intend to use as `icon-image`.

## SDF icons

If you want a symbol icon whose fill/outline color is driven by your layer's `paint`
config (`icon-color`, `icon-halo-color`, `icon-halo-width`, `icon-halo-blur`) instead of
being baked into the image at creation time, the source image has to be a genuine
**signed distance field** (SDF) — a bitmap whose alpha channel encodes *distance to the
nearest edge* rather than a plain antialiased silhouette. This is what Mapbox Studio
produces when you tag a sprite icon as "SDF", and it's how the built-in Maki icons work.

Just passing `options={{ sdf: true }}` (mapbox's own `addImage` option) on a normal
rasterized SVG/PNG does **not** do this conversion — it only tells mapbox to *treat* the
image's alpha channel as if it already were a distance field. On a plain antialiased
mask that produces chunky scaling and soft/broken halos, since there's no real gradient
to sample.

Passing `sdf` (boolean, or an object to override `radius`/`cutoff`) on `<Image>` instead
runs the rasterized `source` through an actual distance transform before it reaches
`addImage`, and sets `sdf: true` for you:

```jsx
<Image id="triangle" source={triangleSvg} sdf />
<Source ...>
  <Layer
    style={{
      type: 'symbol',
      layout: { 'icon-image': 'triangle', 'icon-size': 0.5 },
      paint: {
        'icon-color': ['get', 'color'], // driven by feature data, not baked into the icon
        'icon-halo-color': '#fff',
        'icon-halo-width': 1.5,
      },
    }}
  />
</Source>
```

Notes:

- `options.fill`/`options.stroke` stop mattering once `sdf` is on — an SDF image only
  encodes a silhouette (alpha), not color; color comes entirely from paint properties.
- `radius` (default `8`) controls how many pixels of gradient falloff are encoded around
  each edge, and how much transparent margin is added around the art to make room for
  it — raise it if you need a wide `icon-halo-width`/`icon-halo-blur`.
- `cutoff` (default `0.25`) shifts where along that gradient the shape's "true" edge
  sits; matches mapbox's own glyph-rendering default.
- This applies to `source`, not `pattern` — `pattern`'s hatch/fill textures (diagonal
  lines, hash, chevron, etc.) are meant to tile as `fill-pattern` backgrounds, not act as
  single-color-swappable point icons, so SDF conversion isn't a good fit there. For a
  simple geometric icon (square, triangle, diamond, hexagon, cross), author it as a small
  inline SVG and pass it to `source` with `sdf` instead.
- The underlying distance-transform utility is also exported directly as `toSDF` (from
  `solid-map-gl`) if you need to convert an already-decoded `ImageBitmap`/`ImageData`
  source yourself.

## SVG sources

When `source` is raw SVG markup (a string starting with `<svg`), mapbox-gl's own image loader
always rejects it — it treats any string as a request URL, and markup isn't a valid one — so
`<Image>` falls back to rasterizing it locally onto a `<canvas>` instead. That fallback has a
couple of requirements to get a sharp, correctly-proportioned result:

- Give the SVG explicit, matching `width`/`height` (and a `viewBox`). Without them, the browser
  falls back to a 300×150 default intrinsic size, and the fallback rasterizes at that oversized,
  non-square size instead of your intended icon.
- Design it at its intended aspect ratio. The source is scaled *uniformly* — never stretched — up
  to a minimum of 50px on its smaller axis, so a non-square SVG keeps its proportions rather than
  being squashed into a square.
- Author at 50px or larger per axis. Anything smaller is upscaled to that 50px floor anyway, so
  there's no sharpness benefit to going smaller.
- Rasterization is retina-aware by default: it oversamples by `window.devicePixelRatio` and tags
  the result with a matching `pixelRatio`, so the icon's on-map footprint (its CSS-pixel size at
  `icon-size: 1`) stays the same as an un-oversampled render would have been — just sharper on
  high-DPI screens. Pass `options={{ pixelRatio: N }}` yourself to pin a specific ratio instead of
  matching the current screen.

This only applies to raw SVG markup sources. A `source` that's already an `HTMLImageElement`,
`ImageBitmap`, `ImageData`, or a loadable raster URL (e.g. a `.png`) skips this fallback entirely
and is added as-is — size and `pixelRatio` for those are entirely up to what you provide.

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Image, Layer } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-77.4144, 25.0759],
    zoom: 6,
  } as Viewport);

  return (
    <MapGL
      options={{ style: 'mb:light' }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Image
        id="cat"
        source="https://docs.mapbox.com/mapbox-gl-js/assets/cat.png"
      />
      <Source
        source={{
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [-77.4144, 25.0759],
                },
              },
            ],
          },
        }}
      >
        <Layer
          style={{
            type: 'symbol',
            layout: {
              'icon-image': 'cat',
              'icon-size': 0.25,
            },
          }}
        />
      </Source>
    </MapGL>
  );
};
```
