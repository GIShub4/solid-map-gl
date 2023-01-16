import { onCleanup, createEffect, VoidComponent } from 'solid-js'
import { useMap } from '../MapGL'
import type { FogSpecification } from 'mapbox-gl/src/style-spec/types.js'

type Props = {
  /** Fog/Atmosphere Specifications */
  style?: FogSpecification
}

export const Atmosphere: VoidComponent<Props> = props => {
  if (!useMap()) return
  const [map] = useMap()

  // Add or Update Atmosphere Layer
  createEffect(() => map().setFog(props.style || {}))

  // Remove Atmosphere Layer
  onCleanup(() => map()?.setFog(null))

  return null
}
