import { onCleanup, createEffect, Component } from 'solid-js'
import { useMap } from '../MapGL'
import { useSourceId } from '../Source'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type {
  TerrainSpecification,
  SourceSpecification,
} from 'mapbox-gl/src/style-spec/types.js'

export const Terrain: Component<{
  style: TerrainSpecification
  visible?: boolean
  children?: any
}> = props => {
  const map: MapboxMap = useMap()
  const sourceId: SourceSpecification = useSourceId()

  // Add Terrain Layer
  createEffect(() => {
    map().setTerrain({ ...props.style, source: sourceId })
  })

  // Remove Terrain Layer
  onCleanup(() => map().setTerrain(null))

  // Update Visibility
  createEffect(() => {
    props.visible !== undefined &&
      map().setTerrain(props.visible ? props.style : null)
  })

  return props.children
}
