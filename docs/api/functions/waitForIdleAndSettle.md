[**solid-map-gl**](../README.md)

***

[solid-map-gl](../README.md) / waitForIdleAndSettle

# Function: waitForIdleAndSettle()

> **waitForIdleAndSettle**(`map`, `options?`): `Promise`\<`void`\>

Defined in: [MapGL/tilesSettled.ts:104](https://github.com/GIShub4/solid-map-gl/blob/6b33ac0f95d23dd495f7bca07513b2c548c0d6e2/src/components/MapGL/tilesSettled.ts#L104)

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
