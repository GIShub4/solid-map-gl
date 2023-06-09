import { onCleanup, createEffect, VoidComponent } from 'solid-js'
import { useMap } from '../MapProvider'
import type { Fog } from 'mapbox-gl'

type Props = {
  /** Fog/Atmosphere Specifications */
  style?: Fog
}

export const Atmosphere: VoidComponent<Props> = (props: Props) => {
  const [map] = useMap()

  // Add or Update Atmosphere Layer
  createEffect(() => map().setFog(props.style || {}))

  // Remove Atmosphere Layer
  onCleanup(() => map().setFog(null))

  return null
}
