---
description: Layer Component
---

# Layer

## Props

| Name         | Type                                                                                              | Description                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| id           | string                                                                                            | only required if referenced outside of nested layer                                                       |
| style        | object                                                                                            | [Layer Style Object](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/) — any paint/layout value also accepts `'@name'` to reuse a value from `<MapGL>`'s `constants` prop; a `*-color` paint property additionally accepts a [Tailwind CSS v4](https://tailwindcss.com/docs/colors) color name (e.g. `'blue-600'`, resolved from the page's live `--color-blue-600` variable), a raw CSS Color 4 value (e.g. `'oklch(54.6% 0.245 262.881)'`) that Mapbox itself can't parse, or `'bg-{name} dark:bg-{name}'` (e.g. `'bg-blue-600 dark:bg-blue-400'`) to pick whichever the browser's cascade resolves for the real, compiled Tailwind classes — automatically tracking the page's dark mode |
| customLayer  | [CustomLayerInterface](https://docs.mapbox.com/mapbox-gl-js/api/properties/#customlayerinterface) | To include external layers e.g. [deck.gl](https://deck.gl/)                                               |
| filter       | [FilterSpecification](https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/)               | Filter expression                                                                                         |
| visible      | boolean                                                                                           | Show/Hide Layer                                                                                           |
| sourceId     | string                                                                                            | Required for Vector Sources                                                                               |
| beforeType   | string                                                                                            | background \| fill \| line \| symbol \| raster \| circle \| fill-extrusion \| heatmap \| hillshade \| sky |
| beforeId     | string                                                                                            | Id of Layer to insert Layer before                                                                        |
| featureState | object                                                                                            | Define Feature State                                                                                      |
| pulse        | `boolean \| PulseConfig \| PulseConfig[]`                                                          | Continuously animate one or more paint properties, every field defaulted (see [Pulsing a paint property](#pulsing-a-paint-property) below) |

_\*required_

## Examples

### Circle Layer

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = (props) => {
  const [viewport, setViewport] = createSignal({
    center: [-122.45, 37.78],
    zoom: 6,
  } as Viewport);

  return (
    <MapGL
      options={{ style: 'mb:light' }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Source
        source={{
          type: 'geojson',
          data: 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson',
        }}
      >
        <Layer
          style={{
            type: 'circle',
            paint: {
              'circle-radius': 5,
              'circle-color': 'red',
            },
          }}
        />
      </Source>
    </MapGL>
  );
};
```

### Reusing a color across layers

Define a value once on `<MapGL>`'s `constants` prop, then reference it by name (`'@name'`) in any
number of `<Layer>` style props — updating `constants` re-applies it everywhere it's used.

```jsx
<MapGL options={{ style: 'mb:light' }} constants={{ primary: '#e0492b', roadWidth: 2 }}>
  <Source source={{ type: 'geojson', data: '...' }}>
    <Layer style={{ type: 'fill', paint: { 'fill-color': '@primary' } }} />
    <Layer style={{ type: 'line', paint: { 'line-color': '@primary', 'line-width': '@roadWidth' } }} />
  </Source>
</MapGL>
```

### Automatic light/dark colors

`'bg-{name} dark:bg-{name}'` picks whichever color the browser's own cascade resolves for those
*real*, compiled Tailwind utility classes — so it respects whatever dark-mode strategy your
Tailwind config actually uses (a class or attribute on any ancestor, a media query, ...) rather
than `solid-map-gl` guessing. This needs the full `bg-`-prefixed class names to appear literally in
your own source (not just the bare color name) so Tailwind's build actually generates them.

```jsx
<Layer style={{ type: 'fill', paint: { 'fill-color': 'bg-blue-600 dark:bg-blue-400' } }} />
```

### Pulsing a paint property

`pulse` continuously animates one or more paint properties via `setPaintProperty` on every
animation frame — the standard way to build a "pulsing dot" marker, growing/fading a symbol's
halo around a static icon. Every field defaults, so the bare prop already gives you Tailwind's
familiar [`animate-ping`](https://tailwindcss.com/docs/animation) look on a symbol layer's halo:

```jsx
<Source source={{ type: 'geojson', data: pointFeature }}>
  <Image id="dot" symbol="circle" sdf />
  <Layer
    style={{
      type: 'symbol',
      layout: { 'icon-image': 'dot' },
      paint: { 'icon-color': '#2563eb', 'icon-halo-color': '#2563eb' },
    }}
    pulse
  />
</Source>
```

Each entry accepts:

```ts
{
  property?: string        // e.g. "icon-halo-width", "icon-opacity", "icon-halo-color"; default "icon-halo-width"
  from?: number | string    // a number, or any CSS color string for a *-color property; default 0
  to?: number | string      // default 4
  duration?: number         // full cycle length in ms, default 1500
  waveform?: 'in-out' | 'out' | 'in'  // default 'out'
}
```

> [!WARNING]
> mapbox-gl-js's symbol shader hardcodes the relationship between `icon-halo-width` and
> `icon-size` — once `icon-halo-width` exceeds roughly `6 * icon-size`, the halo stops being a
> ring and fills the *entire* icon with solid `icon-halo-color`. This is a fixed constant in
> mapbox's fragment shader, not something `solid-map-gl`'s `Image`/`sdf` options control (raising
> `sdf`'s `radius` doesn't move the ceiling). If your layer sets a small `icon-size` (e.g. `0.5`),
> scale `pulse`'s `to`/`from` down to match (or bump `icon-size` up) — `to: 4` (the `pulse`
> default) needs `icon-size` of at least `~0.67` to stay clear of it.

`waveform` controls the shape of the cycle:

- **`out`** (default) — a one-directional ease-out ramp from `from` to `to`, holding at `to` for
  the last quarter of the cycle before resetting — the ping shape above (a ring that grows
  outward and fades, then disappears until the next cycle). The most common "pulsing dot" look.
- **`in`** — the mirror of `out`: starts at `to` and ramps down to `from`, holding at `from`.
- **`in-out`** — smooth, continuous back-and-forth between `from` and `to` (sine-eased), with no
  reset — a halo that breathes rather than pings.

Pass an **array** to animate several properties together off one shared frame loop — e.g. growing
the halo *and* fading it out at once, so the ring visibly disappears instead of holding at full
width once it stops growing:

```jsx
<Layer
  style={{ type: 'symbol', layout: { 'icon-image': 'dot' } }}
  pulse={[
    { property: 'icon-halo-width', from: 0, to: 5, duration: 1500, waveform: 'out' },
    { property: 'icon-halo-color', from: 'rgba(37, 99, 235, 1)', to: 'rgba(37, 99, 235, 0)', duration: 1500, waveform: 'out' },
  ]}
/>
```

That second entry is also how to fade *only* the halo's transparency without changing its size:
Mapbox has no standalone numeric halo-opacity property, so `pulse` interpolates the alpha channel
of a `*-color` property directly when `from`/`to` are color strings (parsed once up front, not
re-parsed every frame). Animating `icon-opacity` instead is simpler but fades the whole icon
(core and halo together), not the halo alone.

The same properties work equally well on the symbol itself, not just its halo — e.g. `icon-size`
or `icon-opacity` with any of the three waveforms, for a pulsing/blinking icon instead of a
pulsing ring.

Since this drives real paint properties (not a swapped-out image), it composes with any other
paint value on the same layer, including data-driven expressions on other properties. Only one
`requestAnimationFrame` loop runs per `<Layer>` regardless of how many `pulse` entries it has.
