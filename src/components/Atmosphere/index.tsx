import { onCleanup, createEffect, VoidComponent } from 'solid-js'
import { useMapContext } from '../MapProvider'
import type { Fog } from 'mapbox-gl'

type Props = {
  /** Fog/Atmosphere Specifications */
  style?: Fog
}

export const Atmosphere: VoidComponent<Props> = (props: Props) => {
  const [ctx] = useMapContext()

  // Add or Update Atmosphere Layer
  createEffect(() => ctx.map.setFog(props.style || {}))

  // Remove Atmosphere Layer
  onCleanup(() => ctx.map.setFog(null))

  return null
}
