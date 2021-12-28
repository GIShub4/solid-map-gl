import { onMount, onCleanup, createEffect, Component } from 'solid-js'
import { useMap } from '../MapGL'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type { FogSpecification } from 'mapbox-gl/src/style-spec/types.js'

const Fog: Component<{
  style: FogSpecification
  visible?: boolean
}> = props => {
  const map: MapboxMap = useMap()
  // Add Fog Layer
  onMount(async () => {
    !map().isStyleLoaded() && (await map().once('styledata'))
    map().setFog(props.style)
  })
  // Remove Fog Layer
  onCleanup(() => map().setFog(null))

  // Update Visibility
  createEffect(async () => {
    if (props.visible === undefined) return

    !map().isStyleLoaded() && (await map().once('styledata'))
    map().setFog(props.visible ? props.style : null)
  })

  return props.children
}

export default Fog
