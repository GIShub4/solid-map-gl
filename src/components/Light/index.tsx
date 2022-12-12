import { onCleanup, createEffect, VoidComponent } from 'solid-js'
import { useMap } from '../MapGL'
import type { LightSpecification } from 'mapbox-gl/src/style-spec/types.js'

export const Light: VoidComponent<{
  style: LightSpecification
}> = props => {
  if (!useMap()) return
  const [map] = useMap()

  // Add or Update Light Layer
  createEffect(() => map().setLight(props.style || {}))

  // Remove Light Layer
  onCleanup(() => map()?.setLight(null))

  return null
}
