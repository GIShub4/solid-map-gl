[**solid-map-gl**](../README.md)

***

[solid-map-gl](../README.md) / MapCapturer

# Type Alias: MapCapturer

> **MapCapturer** = `object`

Defined in: [MapGL/offscreenCapture.ts:6](https://github.com/GIShub4/solid-map-gl/blob/ae7f29f3d8d8c10df04bbb4bc3a55ece605347b7/src/components/MapGL/offscreenCapture.ts#L6)

Handed to `<MapGL offscreen>`'s `onCapturerReady` callback.

## Properties

### map

> **map**: `any`

Defined in: [MapGL/offscreenCapture.ts:11](https://github.com/GIShub4/solid-map-gl/blob/ae7f29f3d8d8c10df04bbb4bc3a55ece605347b7/src/components/MapGL/offscreenCapture.ts#L11)

The raw mapboxgl.Map/maplibregl.Map instance — for anything not already covered by
`<Source>`/`<Layer>` children, e.g. reading back computed values. Camera/data changes are
still made the normal declarative way, via `<MapGL>`'s own `viewport` prop and `<Source>`'s
`data` prop.

## Methods

### capture()

> **capture**(`type?`, `quality?`): `string`

Defined in: [MapGL/offscreenCapture.ts:19](https://github.com/GIShub4/solid-map-gl/blob/ae7f29f3d8d8c10df04bbb4bc3a55ece605347b7/src/components/MapGL/offscreenCapture.ts#L19)

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

Defined in: [MapGL/offscreenCapture.ts:21](https://github.com/GIShub4/solid-map-gl/blob/ae7f29f3d8d8c10df04bbb4bc3a55ece605347b7/src/components/MapGL/offscreenCapture.ts#L21)

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

Defined in: [MapGL/offscreenCapture.ts:15](https://github.com/GIShub4/solid-map-gl/blob/ae7f29f3d8d8c10df04bbb4bc3a55ece605347b7/src/components/MapGL/offscreenCapture.ts#L15)

Waits for the map's next 'idle', then for every tile to be genuinely loaded, painted, and (if
applicable) done cross-fading in — see `waitForIdleAndSettle`. Call this after changing
`viewport`/`data` props.

#### Returns

`Promise`\<`void`\>
