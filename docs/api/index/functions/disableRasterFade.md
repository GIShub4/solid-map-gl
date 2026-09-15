[**solid-map-gl**](../../README.md)

***

[solid-map-gl](../../README.md) / [index](../README.md) / disableRasterFade

# Function: disableRasterFade()

> **disableRasterFade**(`map`): `void`

Defined in: [src/components/MapGL/tilesSettled.ts:121](https://github.com/GIShub4/solid-map-gl/blob/163a7e03cd52ceb723738d08b0dfd1b9405617e8/src/components/MapGL/tilesSettled.ts#L121)

Zeros `raster-fade-duration` on every layer that supports it, so newly-loaded raster tiles
appear at full opacity immediately instead of cross-fading in over mapbox-gl's default 300ms —
that fade is a paint-time opacity animation, invisible to `areTilesLoaded()`/`isSourceLoaded()`,
so a capture taken right on load/idle can otherwise catch tiles still visibly fading in. Tries
every layer rather than filtering to `type === "raster"`: some styles (e.g. Mapbox's
Standard/Standard Satellite family) compose their base imagery in ways that don't always surface
as a plain `"raster"`-typed layer in `getStyle().layers`, so filtering by type risked silently
missing the actual imagery layer — `setPaintProperty` throwing for a layer type that doesn't
support this property is caught and ignored instead.

## Parameters

### map

#### getStyle

#### setPaintProperty

## Returns

`void`
