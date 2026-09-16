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
| pulse        | `PulseConfig \| PulseConfig[]`                                                          | Periodic "ping" animation of one or more paint properties (see [Pulsing a paint property](#pulsing-a-paint-property) below) |

_\*required_

## Examples

### Circle Layer

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = (props) => {
  const [viewport, setViewport] = createSignal<Viewport>({
    center: [-122.45, 37.78],
    zoom: 6,
  });

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

`pulse` animates a paint property through a periodic "ping": reset to `from`, ramp out to `to`,
hold, then repeat — the standard way to build a "pulsing dot" marker, growing/fading a circle's
radius or a symbol's halo. The ramp itself is Mapbox's own paint-property transition (not a
per-frame `setPaintProperty` loop), so `pulse` only touches the property twice per cycle and the
map genuinely goes idle during each hold — see the performance note below.

```jsx
<Source source={{ type: 'geojson', data: pointFeature }}>
  <Layer
    style={{ type: 'circle', paint: { 'circle-color': '#2563eb' } }}
    pulse={[
      { property: 'circle-radius', from: 4, to: 20 },
      { property: 'circle-color', from: 'rgba(37, 99, 235, 1)', to: 'rgba(37, 99, 235, 0)' },
    ]}
  />
</Source>
```

Each entry accepts:

```ts
{
  property: string          // e.g. "circle-radius", "icon-halo-width", "circle-color" — required,
                             // no default: which property makes sense depends on the layer type
  from: number | string     // a number, or any CSS color string for a *-color property
  to: number | string
  duration?: number         // full cycle length in ms: ramp + hold, default 1500
  holdFraction?: number     // fraction of `duration` held at `to` before the reset, default 0.25
}
```

Pass an **array** to animate several properties together off one shared cycle — e.g. growing a
ring's radius *and* fading its color at once, so it visibly disappears instead of holding at full
size once it stops growing (the example above does exactly this).

That second entry is also how to fade *only* a halo's transparency without changing its size:
Mapbox has no standalone numeric halo-opacity property, so pass a `*-color` property with
different alpha values for `from`/`to` — mapbox-gl-js interpolates the color (including alpha)
itself as part of the transition. `from`/`to` on a `*-color` property go through the same
Tailwind-name/`oklch()`/... resolution as any other paint color on this layer (see
[Automatic light/dark colors](#automatic-light-dark-colors) above), not a separate code path.

> [!WARNING]
> If you pulse a symbol layer's `icon-halo-width`, mapbox-gl-js's symbol shader hardcodes its
> relationship to `icon-size` — once `icon-halo-width` exceeds roughly `6 * icon-size`, the halo
> stops being a ring and fills the *entire* icon with solid `icon-halo-color`. This is a fixed
> constant in mapbox's fragment shader, not something `solid-map-gl` controls, and it makes
> `icon-halo-width` a poor fit for a large, eye-catching ring — a `circle` layer (as in the
> example above) has no such ceiling and is the better choice for that look.

**Performance:** each `pulse` entry only calls `setPaintProperty` twice per cycle (once to reset,
once to start the ramp) plus one `requestAnimationFrame` to sequence them — not a continuous
per-frame loop. This matters beyond raw CPU cost: mapbox-gl-js only reaches its `'idle'`/
`map.loaded()` state when nothing is actively transitioning, so a paint property that's updated
every single frame (the old implementation) keeps the map permanently "dirty" for as long as it's
mounted — which silently starves anything waiting on that state, including
`@mapbox/mapbox-gl-draw`'s own layer-mounting logic and this library's own
`captureWhenSettled()`/`waitUntilSettled()`. `pulse`'s reset+hold cycle leaves a genuine idle gap
every cycle (`duration * holdFraction`, 375ms of every 1500ms by default) for those to resolve in.
