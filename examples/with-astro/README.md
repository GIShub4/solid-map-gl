# Astro + solid-map-gl

Proof-of-concept for hosting the docs' hero demo as a small, prebuilt static page instead of the
embedded StackBlitz sandbox in `docs/introduction.md`'s "Simple Demo" section — visitors get an
already-rendered page instead of waiting a few seconds for a WebContainer to boot. Uses the "Usage
with Mapbox" example from `.github/README.md` almost verbatim, as `src/components/MapDemo.tsx`.

Unlike the other `examples/*` folders (small Vite apps meant to be forked/edited on StackBlitz),
this one is meant to be `astro build`-ed and deployed as a static site (e.g. GitHub Pages) — it
demonstrates a hosting pattern, not a fork-and-edit sandbox, so it isn't linked from
`docs/examples.md`.

## Running locally

```shell
cd examples/with-astro
pnpm install
pnpm dev
```

## Get a Mapbox token

Astro only exposes environment variables prefixed `PUBLIC_` to client-side code — Vite's own
`VITE_` prefix, which `solid-map-gl`'s `MapGL` falls back to internally, isn't visible here, so
this example passes the token explicitly via `options.accessToken` instead of relying on that
fallback. Copy `.env.example` to `.env.local` and fill in a token from
https://www.mapbox.com/studio/account/tokens/.

## Why `client:only="solid"`

`mapbox-gl` touches `window`/WebGL at import time, which isn't SSR-safe. `client:only="solid"`
skips server rendering for `<MapDemo />` entirely and mounts it purely client-side, the same as any
other browser-only widget in Astro.
