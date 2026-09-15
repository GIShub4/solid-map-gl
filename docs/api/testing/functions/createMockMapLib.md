[**solid-map-gl**](../../README.md)

***

[solid-map-gl](../../README.md) / [testing](../README.md) / createMockMapLib

# Function: createMockMapLib()

> **createMockMapLib**(`opts?`): `object`

Defined in: [src/testUtils/mockMap.ts:312](https://github.com/GIShub4/solid-map-gl/blob/163a7e03cd52ceb723738d08b0dfd1b9405617e8/src/testUtils/mockMap.ts#L312)

Fake `mapLib` module (the `mapbox-gl`/`maplibre-gl` export surface) — covers every class this
library reads off `ctx.mapLib`. `Map` is constructable and returns a `createMockMap()` instance,
so it doubles as the `props.mapLib` passed to a real `<MapGL>` in integration-style tests.

## Parameters

### opts?

#### isMapLibre?

`boolean`

## Returns

`object`

### AttributionControl

> **AttributionControl**: *typeof* `MockControl` = `MockControl`

### FullscreenControl

> **FullscreenControl**: *typeof* `MockControl` = `MockControl`

### GeolocateControl

> **GeolocateControl**: *typeof* `MockControl` = `MockControl`

### LogoControl

> **LogoControl**: *typeof* `MockControl` = `MockControl`

### Map

> **Map**: `any`

### Marker

> **Marker**: *typeof* `MockMarker` = `MockMarker`

### MercatorCoordinate

> **MercatorCoordinate**: *typeof* `MercatorCoordinate`

### NavigationControl

> **NavigationControl**: *typeof* `MockControl` = `MockControl`

### Popup

> **Popup**: *typeof* `MockPopup` = `MockPopup`

### ScaleControl

> **ScaleControl**: *typeof* `MockControl` = `MockControl`

### TerrainControl

> **TerrainControl**: *typeof* `MockControl` = `MockControl`

### version

> **version**: `string` = `"mock"`
