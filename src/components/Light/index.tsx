import { onCleanup, createEffect, VoidComponent } from 'solid-js'
import { useMap } from '../MapProvider'
import type { Light as LightSpecification } from 'mapbox-gl'

type Props = {
  /** Light Specifications */
  style: LightSpecification
}
export const Light: VoidComponent<Props> = (props: Props) => {
  const [map] = useMap()

  // Add or Update Light Layer
  createEffect(() => map().setLight(props.style || {}))

  // Remove Light Layer
  onCleanup(() => map()?.setLight(null))

  return null
}
