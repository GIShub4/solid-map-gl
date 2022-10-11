import {
  onCleanup,
  createEffect,
  VoidComponent,
  createUniqueId,
} from 'solid-js'
import { useMap } from '../MapGL'
import { useSourceId } from '../Source'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type {
  SourceSpecification,
  TerrainSpecification,
} from 'mapbox-gl/src/style-spec/types.js'

export const Terrain: VoidComponent<{
  exaggeration?: number
  source?: TerrainSpecification
  visible?: boolean
}> = props => {
  const map: MapboxMap = useMap()()
  let sourceId: SourceSpecification = useSourceId()

  // Remove Terrain Layer
  onCleanup(() => map?.setTerrain(null))

  // Add Terrain Layer
  createEffect(() => {
    if (sourceId) {
      sourceId = createUniqueId()
      map.addSource(
        sourceId,
        map.isMapLibre
          ? {
              type: 'raster-dem',
              url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
              tileSize: 256,
            }
          : {
              type: 'raster-dem',
              url: 'mapbox://mapbox.terrain-rgb',
              tileSize: 512,
              maxzoom: 14,
            }
      )
    }
    map.setTerrain({
      exaggeration: props.exaggeration || 1,
      source: sourceId,
    })
  })

  // Update Visibility
  createEffect(() => {
    props.visible !== undefined &&
      map.setTerrain(
        props.visible
          ? { exaggeration: props.exaggeration || 1, source: sourceId }
          : null
      )
  })

  return null
}
