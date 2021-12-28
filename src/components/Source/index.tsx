import {
  onMount,
  onCleanup,
  createEffect,
  Component,
  createContext,
  useContext,
  createUniqueId,
} from 'solid-js'
import { useMap } from '../MapGL'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type {
  Source,
  SourceSpecification,
} from 'mapbox-gl/src/style-spec/types.js'

const SourceContext = createContext<Source>()

const useSource = (): Source => useContext(SourceContext)

const SourceComponent: Component<{
  id?: string
  source: SourceSpecification
}> = props => {
  const map: MapboxMap = useMap()
  props.id = props.id || createUniqueId()
  // Add Source
  onMount(async () => {
    !map().isStyleLoaded() && (await map().once('styledata'))
    !map().getSource(props.id) && map().addSource(props.id, props.source)
  })

  // Remove Source
  onCleanup(() => {
    map()
      .getStyle()
      .layers.forEach(
        layer => layer.source === props.id && map().removeLayer(layer.id)
      )
    map().getSource(props.id) && map().removeSource(props.id)
  })

  // Update GeoJSON Data
  createEffect(async () => {
    if (props.source.type !== 'geojson' && !props.source.data) return

    map().getSource(props.id) &&
      map().getSource(props.id).setData(props.source.data)
  })

  return (
    <SourceContext.Provider value={{ source: props.id }}>
      {props.children}
    </SourceContext.Provider>
  )
}

export { SourceComponent as default, useSource }
