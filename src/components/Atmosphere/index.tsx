import { onCleanup, createEffect, VoidComponent } from 'solid-js'
import { useMap } from '../MapGL'
import type { FogSpecification } from 'mapbox-gl/src/style-spec/types.js'

export const Atmosphere: VoidComponent<{
  style: FogSpecification
}> = props => {
  if (!useMap()) return
  const [map] = useMap()

  // Add or Update Atmosphere Layer
  createEffect(() => map().setFog(props.style || {}))

  // Remove Atmosphere Layer
  onCleanup(() => map()?.setFog(null))

  return null
}
