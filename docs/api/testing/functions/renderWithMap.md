[**solid-map-gl**](../../README.md)

***

[solid-map-gl](../../README.md) / [testing](../README.md) / renderWithMap

# Function: renderWithMap()

> **renderWithMap**(`ui`, `opts?`): `object` & `object` & `object` & `object`

Defined in: [src/testUtils/renderWithMap.tsx:10](https://github.com/GIShub4/solid-map-gl/blob/1edfb2779e99e094b00b8a942205afe91669c6ca/src/testUtils/renderWithMap.tsx#L10)

Renders `ui` inside a `<MapProvider>` backed by a mock map, mirroring how every real
component is only ever mounted underneath `<MapGL>`. Reused across component test files
instead of hand-wiring `MapProvider` + a mock per test.

## Parameters

### ui

() => `any`

### opts?

#### constants?

`Record`\<`string`, `any`\>

#### isMapLibre?

`boolean`

#### map?

`any`

## Returns

`object` & `object` & `object` & `object`
