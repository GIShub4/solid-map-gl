import {
  onCleanup,
  createEffect,
  VoidComponent,
  createUniqueId,
} from 'solid-js'
import { useMap } from '../MapGL'
import { useSourceId } from '../Source'
import type {
  SourceSpecification,
  TerrainSpecification,
} from 'mapbox-gl/src/style-spec/types.js'

type Props = {
  /** Height exaggeration factor */
  exaggeration?: number
  /** Terrain Source object */
  source?: TerrainSpecification
}

export const Terrain: VoidComponent<Props> = props => {
  if (!useMap()) return
  const [map] = useMap()
  let sourceId: SourceSpecification = useSourceId()

  // Add Terrain Layer
  if (sourceId === undefined) {
    sourceId = createUniqueId()
    map().addSource(
      sourceId,
      map().isMapLibre
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
    map().sourceIdList.push(sourceId)
  }

  createEffect(() => {
    map().setTerrain({
      exaggeration: props.exaggeration || 1,
      source: sourceId,
    })
  })

  // Remove Terrain Layer
  // onCleanup(() => map().setTerrain(null))

  return null
}
