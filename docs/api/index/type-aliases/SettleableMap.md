[**solid-map-gl**](../../README.md)

***

[solid-map-gl](../../README.md) / [index](../README.md) / SettleableMap

# Type Alias: SettleableMap

> **SettleableMap** = `object`

Defined in: [src/components/MapGL/tilesSettled.ts:11](https://github.com/GIShub4/solid-map-gl/blob/163a7e03cd52ceb723738d08b0dfd1b9405617e8/src/components/MapGL/tilesSettled.ts#L11)

Any object shaped enough like `mapboxgl.Map`/`maplibregl.Map` for the functions in this module —
kept loose (not the real `mapboxgl.Map` type) so this file has no hard dependency on either
library's types.

## Properties

### style?

> `optional` **style?**: `object`

Defined in: [src/components/MapGL/tilesSettled.ts:15](https://github.com/GIShub4/solid-map-gl/blob/163a7e03cd52ceb723738d08b0dfd1b9405617e8/src/components/MapGL/tilesSettled.ts#L15)

#### hasTransitions?

> `optional` **hasTransitions?**: () => `boolean`

##### Returns

`boolean`

## Methods

### areTilesLoaded()

> **areTilesLoaded**(): `boolean`

Defined in: [src/components/MapGL/tilesSettled.ts:12](https://github.com/GIShub4/solid-map-gl/blob/163a7e03cd52ceb723738d08b0dfd1b9405617e8/src/components/MapGL/tilesSettled.ts#L12)

#### Returns

`boolean`

***

### once()

> **once**(`event`, `cb`): `unknown`

Defined in: [src/components/MapGL/tilesSettled.ts:14](https://github.com/GIShub4/solid-map-gl/blob/163a7e03cd52ceb723738d08b0dfd1b9405617e8/src/components/MapGL/tilesSettled.ts#L14)

#### Parameters

##### event

`"idle"`

##### cb

() => `void`

#### Returns

`unknown`

***

### triggerRepaint()

> **triggerRepaint**(): `void`

Defined in: [src/components/MapGL/tilesSettled.ts:13](https://github.com/GIShub4/solid-map-gl/blob/163a7e03cd52ceb723738d08b0dfd1b9405617e8/src/components/MapGL/tilesSettled.ts#L13)

#### Returns

`void`
