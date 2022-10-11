import { onCleanup, createEffect, VoidComponent } from 'solid-js'
import { useMap } from '../MapGL'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type { LightSpecification } from 'mapbox-gl/src/style-spec/types.js'

export const Light: VoidComponent<{
  style: LightSpecification
}> = props => {
  const map: MapboxMap = useMap()()

  // Remove Light Layer
  onCleanup(() => map?.setLight(null))

  // Add Light Layer
  createEffect(() => map.setLight(props.style || {}))

  return null
}
