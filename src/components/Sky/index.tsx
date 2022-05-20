import { onCleanup, createEffect, Component } from 'solid-js'
import { useMap } from '../MapGL'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type { StyleSpecification } from 'mapbox-gl/src/style-spec/types.js'

export const Sky: Component<{
  style: StyleSpecification
  visible?: boolean
  children?: any
}> = props => {
  const map: MapboxMap = useMap()
  const layerId = '_sky'

  // Add Sky Layer
  createEffect(() => {
    if (!map()) return
    map().getLayer(layerId) && map().addLayer({ ...props.style, id: layerId })
  })

  // Remove Sky Layer
  onCleanup(() => map().getLayer(layerId) && map().removeLayer(layerId))

  // Update Visibility
  createEffect(() => {
    if (!map()) return
    props.visible !== undefined &&
      map().setLayoutProperty(
        layerId,
        'visibility',
        props.visible ? 'visible' : 'none'
      )
  })

  return props.children
}
