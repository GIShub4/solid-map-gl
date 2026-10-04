[**solid-map-gl**](../../README.md)

***

[solid-map-gl](../../README.md) / [index](../README.md) / disableRasterFade

# Function: disableRasterFade()

> **disableRasterFade**(`map`): `void`

Defined in: [src/components/MapGL/tilesSettled.ts:126](https://github.com/GIShub4/solid-map-gl/blob/1edfb2779e99e094b00b8a942205afe91669c6ca/src/components/MapGL/tilesSettled.ts#L126)

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
