import { onCleanup, createEffect, VoidComponent } from 'solid-js'
import { useMap } from '../MapGL'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type { FogSpecification } from 'mapbox-gl/src/style-spec/types.js'

export const Atmosphere: VoidComponent<{
  style: FogSpecification
}> = props => {
  const map: MapboxMap = useMap()()

  // Remove Atmosphere Layer
  onCleanup(() => map?.setFog(null))

  // Add Atmosphere Layer
  createEffect(() => map.setFog(props.style || {}))

  return null
}
