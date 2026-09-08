# Examples

Each subfolder here is a small, standalone Vite + SolidJS app demonstrating one feature of
`solid-map-gl`, mirroring the list in [`docs/examples.md`](../docs/examples.md). They install the
*published* `solid-map-gl` package from npm (not a local/workspace link), so each one also works
when opened in isolation — which is what the "fork on StackBlitz" links in the docs do, via
`stackblitz.com/fork/github/gishub4/solid-map-gl/tree/main/examples/<name>`.

These are not part of the pnpm workspace (`pnpm-workspace.yaml` has no `packages:` glob), aren't
built/tested by the root `pnpm build`/`pnpm test`, and aren't covered by CI — they're reference
code for docs/StackBlitz, not a package this repo publishes.

## Running one locally

```shell
cd examples/<name>
pnpm install
pnpm dev
```

Most examples need a Mapbox access token — get one at
https://www.mapbox.com/studio/account/tokens/ and either pass it via `options.accessToken` in
`src/index.tsx`, or set `VITE_MAPBOX_ACCESS_TOKEN` in a `.env.local` file in that example's folder
(picked up automatically by Vite). The `use-maplibre` example needs no token — MapLibre's demo
style is free to use.

## Keeping these in sync

If a `solid-map-gl` API change breaks one of these, it should show up as a type/runtime error in
that example's own `src/index.tsx` — treat that as a signal the docs need updating alongside the
library, not just the code.
