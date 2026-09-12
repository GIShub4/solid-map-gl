[**solid-map-gl**](../README.md)

***

[solid-map-gl](../README.md) / MapCapturer

# Type Alias: MapCapturer

> **MapCapturer** = `object`

Defined in: offscreenCapture.ts:6

Handed to `<MapGL offscreen>`'s `onCapturerReady` callback.

## Properties

### map

> **map**: `any`

Defined in: offscreenCapture.ts:11

The raw mapboxgl.Map/maplibregl.Map instance — for anything not already covered by
`<Source>`/`<Layer>` children, e.g. reading back computed values. Camera/data changes are
still made the normal declarative way, via `<MapGL>`'s own `viewport` prop and `<Source>`'s
`data` prop.

## Methods

### capture()

> **capture**(`type?`, `quality?`): `string`

Defined in: offscreenCapture.ts:19

`map.getCanvas().toDataURL(type, quality)`. Call after `waitUntilSettled()`, or use
`captureWhenSettled()` to do both in one call. The result can be handed to any PDF/document
library — this doesn't depend on or assume one.

#### Parameters

##### type?

`string`

##### quality?

`number`

#### Returns

`string`

***

### captureWhenSettled()

> **captureWhenSettled**(`type?`, `quality?`): `Promise`\<`string`\>

Defined in: offscreenCapture.ts:21

`await waitUntilSettled()` then `capture()`, in one call.

#### Parameters

##### type?

`string`

##### quality?

`number`

#### Returns

`Promise`\<`string`\>

***

### waitUntilSettled()

> **waitUntilSettled**(): `Promise`\<`void`\>

Defined in: offscreenCapture.ts:15

Waits for the map's next 'idle', then for every tile to be genuinely loaded, painted, and (if
applicable) done cross-fading in — see `waitForIdleAndSettle`. Call this after changing
`viewport`/`data` props.

#### Returns

`Promise`\<`void`\>
