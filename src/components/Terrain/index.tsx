import { createEffect, VoidComponent, createUniqueId } from 'solid-js'
import { useMapContext } from '../MapProvider'
import { useSourceId } from '../Source'
import type { TerrainSpecification } from 'mapbox-gl'

export const Terrain: VoidComponent<TerrainSpecification> = (props: TerrainSpecification) => {
  const [ctx] = useMapContext()
  let sourceId: string = useSourceId()

  // Add Terrain Source if not already defined
  if (!sourceId && !props.source) {
    sourceId = createUniqueId()
    ctx.map.addSource(sourceId,
      {
        type: 'raster-dem',
        url: ctx.map.isMapLibre
          ? 'https://demotiles.maplibre.org/terrain-tiles/tiles.json'
          : 'mapbox://mapbox.terrain-rgb',
        tileSize: ctx.map.isMapLibre ? 256 : 512,
        maxzoom: ctx.map.isMapLibre ? undefined : 14
      }
    )
    ctx.map.sourceIdList.push(sourceId)
  }

  // Add or Update Terrain Layer
  createEffect(() => {
    ctx.map.setTerrain({
      exaggeration: props.exaggeration || 1,
      source: props.source || sourceId,
    })
  })

  return null
}
