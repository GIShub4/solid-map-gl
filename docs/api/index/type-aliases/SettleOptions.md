[**solid-map-gl**](../../README.md)

***

[solid-map-gl](../../README.md) / [index](../README.md) / SettleOptions

# Type Alias: SettleOptions

> **SettleOptions** = `object`

Defined in: [src/components/MapGL/tilesSettled.ts:64](https://github.com/GIShub4/solid-map-gl/blob/163a7e03cd52ceb723738d08b0dfd1b9405617e8/src/components/MapGL/tilesSettled.ts#L64)

## Properties

### fadeMargin?

> `optional` **fadeMargin?**: `number`

Defined in: [src/components/MapGL/tilesSettled.ts:73](https://github.com/GIShub4/solid-map-gl/blob/163a7e03cd52ceb723738d08b0dfd1b9405617e8/src/components/MapGL/tilesSettled.ts#L73)

Extra flat delay (ms) to outlast a `raster-fade-duration` cross-fade still in flight after
tiles report loaded — there's no public event for "the fade finished", and the internal
tracking (`hasActiveFadeTransition`) doesn't reliably cover imported style fragments (e.g.
Standard/Standard Satellite). Default 400 (mapbox-gl's own `raster-fade-duration` default is
300). Set to 0 to skip this step entirely.

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [src/components/MapGL/tilesSettled.ts:67](https://github.com/GIShub4/solid-map-gl/blob/163a7e03cd52ceb723738d08b0dfd1b9405617e8/src/components/MapGL/tilesSettled.ts#L67)

Max time (ms) to keep polling `areTilesLoaded()` before giving up and moving on anyway.
Default 10000.
