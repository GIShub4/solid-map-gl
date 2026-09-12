[**solid-map-gl**](../README.md)

***

[solid-map-gl](../README.md) / SDFOptions

# Type Alias: SDFOptions

> **SDFOptions** = `object`

Defined in: components/Image/sdf.ts:77

## Properties

### cutoff?

> `optional` **cutoff?**: `number`

Defined in: components/Image/sdf.ts:83

Where along the gradient (0-1) the shape's "true" edge sits; matches mapbox's own
 glyph default.

***

### radius?

> `optional` **radius?**: `number`

Defined in: components/Image/sdf.ts:80

Pixels of gradient falloff encoded around each edge. Needs matching empty margin
 around the source art (see `sdfPadding`) or the field clips at the bitmap border.
