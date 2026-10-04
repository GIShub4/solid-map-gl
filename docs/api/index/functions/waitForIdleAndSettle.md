[**solid-map-gl**](../../README.md)

***

[solid-map-gl](../../README.md) / [index](../README.md) / waitForIdleAndSettle

# Function: waitForIdleAndSettle()

> **waitForIdleAndSettle**(`map`, `options?`): `Promise`\<`void`\>

Defined in: [src/components/MapGL/tilesSettled.ts:108](https://github.com/GIShub4/solid-map-gl/blob/1edfb2779e99e094b00b8a942205afe91669c6ca/src/components/MapGL/tilesSettled.ts#L108)

Waits for the map's next 'idle' event, then `settleAfterIdle`. The convenience entry point for
off-screen/headless capture: call your own `jumpTo`/`fitBounds`/`setData` first, then `await` this
before reading the canvas. Calls `triggerRepaint()` itself before waiting — 'idle' only fires on
the *transition into* idle, so a map that's already idle with nothing queued (e.g. capturing
whatever's on screen with no preceding camera/data change) would otherwise never fire another one
and this would hang forever. Redundant, and harmless, if the map isn't idle yet: mapbox-gl/
maplibre-gl coalesce repeated `triggerRepaint()` calls into whatever frame is already pending.

## Parameters

### map

[`SettleableMap`](../type-aliases/SettleableMap.md)

### options?

[`SettleOptions`](../type-aliases/SettleOptions.md) = `{}`

## Returns

`Promise`\<`void`\>
