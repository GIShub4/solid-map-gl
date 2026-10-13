[**solid-map-gl**](../../README.md)

***

[solid-map-gl](../../README.md) / [testing](../README.md) / createMockDrawLib

# Function: createMockDrawLib()

> **createMockDrawLib**(): `any`

Defined in: [src/testUtils/mockMap.ts:368](https://github.com/GIShub4/solid-map-gl/blob/main/src/testUtils/mockMap.ts#L368)

Fake `@mapbox/mapbox-gl-draw`-shaped `lib` prop for `<Draw>`. The custom modes under
`components/Draw/modes` only ever spread `lib.modes.draw_*` at construction time (never call
into it eagerly), so an empty `modes` object is enough to exercise `Draw`'s own wiring.

## Returns

`any`
