[**solid-map-gl**](../README.md)

***

[solid-map-gl](../README.md) / settleAfterIdle

# Function: settleAfterIdle()

> **settleAfterIdle**(`map`, `options?`): `Promise`\<`void`\>

Defined in: [MapGL/tilesSettled.ts:82](https://github.com/GIShub4/solid-map-gl/blob/8fbe8e36fa5f350afec275369270d8d47b1480f0/src/components/MapGL/tilesSettled.ts#L82)

The actual "is this map done, visually" check: polls `areTilesLoaded()`, confirms a real paint
via two animation frames, then (unless `fadeMargin` is 0) waits out any raster-fade cross-fade
still in flight. Call this from inside your own `map.once('idle', ...)` — it doesn't listen for
'idle' itself, since 'idle' can otherwise fire while raster tiles are still fetching, mid
GPU-upload, or still cross-fading in, none of which 'idle' itself waits out. Use
`waitForIdleAndSettle` for the common case of "wait for the next idle, then this".

## Parameters

### map

[`SettleableMap`](../type-aliases/SettleableMap.md)

### options?

[`SettleOptions`](../type-aliases/SettleOptions.md) = `{}`

## Returns

`Promise`\<`void`\>
