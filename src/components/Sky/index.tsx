import { onMount, onCleanup, createEffect, Component } from 'solid-js'
import { useMap } from '../MapGL'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type { StyleSpecification } from 'mapbox-gl/src/style-spec/types.js'

const Sky: Component<{
  style: StyleSpecification
  visible?: boolean
}> = props => {
  const map: MapboxMap = useMap()
  const layerId = '_sky'
  // Add Sky Layer
  onMount(async () => {
    !map().isStyleLoaded() && (await map().once('styledata'))
    !map().getLayer(layerId) && map().addLayer({ ...props.style, id: layerId })
  })

  // Remove Sky Layer
  onCleanup(() => map().getLayer(layerId) && map().removeLayer(layerId))

  // Update Visibility
  createEffect(async () => {
    if (props.visible === undefined) return

    !map().isStyleLoaded() && (await map().once('styledata'))
    map().setLayoutProperty(
      layerId,
      'visibility',
      props.visible ? 'visible' : 'none'
    )
  })

  return props.children
}

export default Sky
