[**solid-map-gl**](../../README.md)

***

[solid-map-gl](../../README.md) / [index](../README.md) / SDFOptions

# Type Alias: SDFOptions

> **SDFOptions** = `object`

Defined in: [src/components/Image/sdf.ts:77](https://github.com/GIShub4/solid-map-gl/blob/1edfb2779e99e094b00b8a942205afe91669c6ca/src/components/Image/sdf.ts#L77)

## Properties

### cutoff?

> `optional` **cutoff?**: `number`

Defined in: [src/components/Image/sdf.ts:83](https://github.com/GIShub4/solid-map-gl/blob/1edfb2779e99e094b00b8a942205afe91669c6ca/src/components/Image/sdf.ts#L83)

Where along the gradient (0-1) the shape's "true" edge sits; matches mapbox's own
 glyph default.

***

### radius?

> `optional` **radius?**: `number`

Defined in: [src/components/Image/sdf.ts:80](https://github.com/GIShub4/solid-map-gl/blob/1edfb2779e99e094b00b8a942205afe91669c6ca/src/components/Image/sdf.ts#L80)

Pixels of gradient falloff encoded around each edge. Needs matching empty margin
 around the source art (see `sdfPadding`) or the field clips at the bitmap border.
