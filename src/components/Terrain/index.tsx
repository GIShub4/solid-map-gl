import { createEffect, VoidComponent, createUniqueId } from 'solid-js'
import { useMap } from '../MapProvider'
import { useSourceId } from '../Source'
import type { TerrainSpecification } from 'mapbox-gl'

export const Terrain: VoidComponent<TerrainSpecification> = (props: TerrainSpecification) => {
  const [map] = useMap()
  let sourceId: string = useSourceId()

  // Add Terrain Source if not already defined
  if (!sourceId && !props.source) {
    sourceId = createUniqueId()
    map().addSource(sourceId,
      {
        type: 'raster-dem',
        url: map().isMapLibre
          ? 'https://demotiles.maplibre.org/terrain-tiles/tiles.json'
          : 'mapbox://mapbox.terrain-rgb',
        tileSize: map().isMapLibre ? 256 : 512,
        maxzoom: map().isMapLibre ? undefined : 14
      }
    )
    map().sourceIdList.push(sourceId)
  }

  // Add or Update Terrain Layer
  createEffect(() => {
    map().setTerrain({
      exaggeration: props.exaggeration || 1,
      source: props.source || sourceId,
    })
  })

  return null
}
