import { onCleanup, createEffect, Component, createUniqueId } from 'solid-js'
import { useMap } from '../MapGL'
import { useSourceId } from '../Source'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type { SourceSpecification } from 'mapbox-gl/src/style-spec/types.js'

export const Terrain: Component<{
  exaggeration?: number
  visible?: boolean
  children?: any
}> = props => {
  const map: MapboxMap = useMap()
  let sourceId: SourceSpecification = useSourceId()

  // Add Terrain Layer
  createEffect(() => {
    if (!sourceId) {
      sourceId = createUniqueId()
      map().addSource(sourceId, {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb',
        tileSize: 512,
        maxzoom: 14,
      })
    }
    map().setTerrain({
      exaggeration: props.exaggeration || 1,
      source: sourceId,
    })
  })

  // Remove Terrain Layer
  onCleanup(() => map().setTerrain(null))

  // Update Visibility
  createEffect(() => {
    props.visible !== undefined &&
      map().setTerrain(
        props.visible
          ? { exaggeration: props.exaggeration || 1, source: sourceId }
          : null
      )
  })

  return props.children
}
