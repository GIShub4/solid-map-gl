import { onMount, onCleanup, createEffect, Component } from 'solid-js'
import { useMap } from '../MapGL'
import { useSource } from '../Source'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type {
  TerrainSpecification,
  SourceSpecification,
} from 'mapbox-gl/src/style-spec/types.js'

const Terrain: Component<{
  style: TerrainSpecification
  visible?: boolean
}> = props => {
  const map: MapboxMap = useMap()
  const source: SourceSpecification = useSource()

  // Add Terrain Layer
  onMount(async () => {
    !map().isStyleLoaded() && (await map().once('styledata'))
    map().setTerrain({ ...props.style, source: source.source })
  })

  // Remove Terrain Layer
  onCleanup(() => map().setTerrain(null))

  // Update Visibility
  createEffect(async () => {
    if (props.visible === undefined) return

    !map().isStyleLoaded() && (await map().once('styledata'))
    map().setTerrain(props.visible ? props.style : null)
  })

  return props.children
}

export default Terrain
