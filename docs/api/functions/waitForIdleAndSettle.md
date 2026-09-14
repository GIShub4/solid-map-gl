[**solid-map-gl**](../README.md)

***

[solid-map-gl](../README.md) / waitForIdleAndSettle

# Function: waitForIdleAndSettle()

> **waitForIdleAndSettle**(`map`, `options?`): `Promise`\<`void`\>

Defined in: [MapGL/tilesSettled.ts:104](https://github.com/GIShub4/solid-map-gl/blob/ae7f29f3d8d8c10df04bbb4bc3a55ece605347b7/src/components/MapGL/tilesSettled.ts#L104)

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
