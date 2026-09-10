# SolidStart + solid-map-gl

Proof-of-concept for using `solid-map-gl` inside a SolidStart app — the same "Usage with Mapbox"
demo as `examples/with-astro`, wired up through SolidStart's `clientOnly` instead of Astro's
`client:only="solid"`.

Unlike the other `examples/*` folders (small Vite apps meant to be forked/edited on StackBlitz),
this one demonstrates a framework-integration pattern, not a fork-and-edit sandbox — it isn't
linked from `docs/examples.md`.

## Running locally

```shell
cd examples/with-solidstart
pnpm install
pnpm dev
```

## Get a Mapbox token

Copy `.env.example` to `.env` and fill in a token from
https://www.mapbox.com/studio/account/tokens/. SolidStart follows Vite's own convention here — a
`VITE_`-prefixed variable in `.env` is exposed to client code automatically, which is exactly the
fallback `MapGL`'s `options.accessToken` already uses internally (see `docs/start.md`). That's
different from `examples/with-astro`, where Astro's `PUBLIC_` prefix means the token has to be
passed explicitly instead.

## Why `clientOnly`

`mapbox-gl`/`maplibre-gl` need a real WebGL context, so there's nothing for `MapGL` to usefully
render on the server — server output is just an empty container `<div>` (see this repo's
`src/components/MapGL/index.ssr.test.tsx`, which asserts exactly that against a real,
DOM-less server render). `src/app.tsx` wraps `MapDemo` in `clientOnly()` so SolidStart renders a
plain `fallback` server-side and skips straight to mounting the real map client-side, the same
role Astro's `client:only="solid"` plays in `examples/with-astro`.
