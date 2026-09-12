[**solid-map-gl**](../README.md)

***

[solid-map-gl](../README.md) / SettleableMap

# Type Alias: SettleableMap

> **SettleableMap** = `object`

Defined in: tilesSettled.ts:11

Any object shaped enough like `mapboxgl.Map`/`maplibregl.Map` for the functions in this module —
kept loose (not the real `mapboxgl.Map` type) so this file has no hard dependency on either
library's types.

## Properties

### style?

> `optional` **style?**: `object`

Defined in: tilesSettled.ts:15

#### hasTransitions?

> `optional` **hasTransitions?**: () => `boolean`

##### Returns

`boolean`

## Methods

### areTilesLoaded()

> **areTilesLoaded**(): `boolean`

Defined in: tilesSettled.ts:12

#### Returns

`boolean`

***

### once()

> **once**(`event`, `cb`): `unknown`

Defined in: tilesSettled.ts:14

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

Defined in: tilesSettled.ts:13

#### Returns

`void`
