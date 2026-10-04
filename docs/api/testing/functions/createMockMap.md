[**solid-map-gl**](../../README.md)

***

[solid-map-gl](../../README.md) / [testing](../README.md) / createMockMap

# Function: createMockMap()

> **createMockMap**(`opts?`): `any`

Defined in: [src/testUtils/mockMap.ts:25](https://github.com/GIShub4/solid-map-gl/blob/1edfb2779e99e094b00b8a942205afe91669c6ca/src/testUtils/mockMap.ts#L25)

Public `solid-map-gl/testing` entry point — the same mock `mapboxgl.Map`/`maplibregl.Map` and
`<MapProvider>` render helper this library's own test suite uses (see `.claude/dev-notes.md`
#158: real map construction depends on a real WebGL context, which environments like Vitest/
jsdom don't have, so `<MapGL>` can't be mounted directly in a test). Requires `vitest` and
`@solidjs/testing-library` — both optional peer dependencies, only needed if you import from
this entry.

## Parameters

### opts?

#### isMapLibre?

`boolean`

## Returns

`any`
