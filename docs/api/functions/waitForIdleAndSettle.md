[**solid-map-gl**](../README.md)

***

[solid-map-gl](../README.md) / waitForIdleAndSettle

# Function: waitForIdleAndSettle()

> **waitForIdleAndSettle**(`map`, `options?`): `Promise`\<`void`\>

Defined in: [tilesSettled.ts:104](https://github.com/GIShub4/solid-map-gl/blob/b14ea43af027c491ee8aae3c366959422b824819/src/tilesSettled.ts#L104)

Waits for the map's next 'idle' event, then `settleAfterIdle`. The convenience entry point for
off-screen/headless capture: call your own `jumpTo`/`fitBounds`/`setData` first, then `await` this
before reading the canvas.

## Parameters

### map

[`SettleableMap`](../type-aliases/SettleableMap.md)

### options?

[`SettleOptions`](../type-aliases/SettleOptions.md) = `{}`

## Returns

`Promise`\<`void`\>
