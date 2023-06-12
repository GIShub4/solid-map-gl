import { onCleanup, createEffect, VoidComponent } from 'solid-js'
import { useMapContext } from '../MapProvider'
import type { Light as LightSpecification } from 'mapbox-gl'

type Props = {
  /** Light Specifications */
  style: LightSpecification
}
export const Light: VoidComponent<Props> = (props: Props) => {
  const [ctx] = useMapContext()

  // Add or Update Light Layer
  createEffect(() => ctx.map.setLight(props.style || {}))

  // Remove Light Layer
  onCleanup(() => ctx.map?.setLight(null))

  return null
}
