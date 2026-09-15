[**solid-map-gl**](../README.md)

***

[solid-map-gl](../README.md) / SDFOptions

# Type Alias: SDFOptions

> **SDFOptions** = `object`

Defined in: [Image/sdf.ts:77](https://github.com/GIShub4/solid-map-gl/blob/6b33ac0f95d23dd495f7bca07513b2c548c0d6e2/src/components/Image/sdf.ts#L77)

## Properties

### cutoff?

> `optional` **cutoff?**: `number`

Defined in: [Image/sdf.ts:83](https://github.com/GIShub4/solid-map-gl/blob/6b33ac0f95d23dd495f7bca07513b2c548c0d6e2/src/components/Image/sdf.ts#L83)

Where along the gradient (0-1) the shape's "true" edge sits; matches mapbox's own
 glyph default.

***

### radius?

> `optional` **radius?**: `number`

Defined in: [Image/sdf.ts:80](https://github.com/GIShub4/solid-map-gl/blob/6b33ac0f95d23dd495f7bca07513b2c548c0d6e2/src/components/Image/sdf.ts#L80)

Pixels of gradient falloff encoded around each edge. Needs matching empty margin
 around the source art (see `sdfPadding`) or the field clips at the bitmap border.
