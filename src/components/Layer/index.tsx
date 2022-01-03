import { onMount, createEffect, Component, createUniqueId } from 'solid-js'
import { useMap } from '../MapGL'
import { useSource } from '../Source'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type {
  FilterSpecification,
  StyleSpecification,
  SourceSpecification,
} from 'mapbox-gl/src/style-spec/types.js'
import type { CustomLayerInterface } from 'mapbox-gl/src/style/style_layer/custom_style_layer'

type KV = {
  string?: any
}

const diff = (newProps: KV = {}, prevProps: KV = {}) => {
  const keys = new Set([...Object.keys(newProps), ...Object.keys(prevProps)])
  return [...keys].reduce((acc, key: string) => {
    const value = newProps[key]
    if (value !== prevProps[key]) {
      acc.push([key, value])
    }
    return acc
  }, [])
}

const Layer: Component<{
  id?: string
  style?: StyleSpecification
  layer?: CustomLayerInterface
  filter?: FilterSpecification
  visible?: boolean
  sourceId?: string
  beforeType?:
    | 'background'
    | 'fill'
    | 'line'
    | 'symbol'
    | 'raster'
    | 'circle'
    | 'fill-extrusion'
    | 'heatmap'
    | 'hillshade'
    | 'sky'
  beforeId?: string
  featureState?: { id: number | string; state: object }
}> = props => {
  const map: MapboxMap = useMap()
  const source: SourceSpecification = useSource()
  props.id = props.id || createUniqueId()
  // Add Layer
  onMount(async () => {
    !map().isStyleLoaded() && (await map().once('styledata'))

    if (map().getLayer(props.id)) return

    map().addLayer(
      props.layer || {
        ...props.style,
        id: props.id,
        source: source.source,
      },
      props.beforeType
        ? map()
            .getStyle()
            .layers.find(l => l.type === props.beforeType).id
        : props.beforeId
    )
  })

  // Update Style
  createEffect((prev: any) => {
    if (!props.style && map().getLayer(props.id)) return

    diff(props.style.paint, prev.paint).forEach(([key, value]) =>
      map().setPaintProperty(props.id, key, value)
    )

    diff(props.style.layout, prev.layout).forEach(([key, value]) =>
      map().setLayoutProperty(props.id, key, value)
    )

    if (
      props.style.minzoom !== prev.minzoom ||
      props.style.maxzoom !== prev.max
    )
      map().setLayerZoomRange(
        props.id,
        props.style.minzoom,
        props.style.maxzoom
      )

    return props.style
  }, props.style)

  // Update Visibility
  createEffect(async () => {
    if (props.visible === undefined) return

    !map().isStyleLoaded() && (await map().once('styledata'))
    map().setLayoutProperty(
      props.id,
      'visibility',
      props.visible ? 'visible' : 'none',
      { validate: false }
    )
  })

  // Update Filter
  createEffect(async () => {
    if (!props.filter) return

    !map().isStyleLoaded() && (await map().once('styledata'))
    map().setFilter(props.id, props.filter)
  })

  // Update Feature State
  createEffect(async () => {
    if (!props.featureState?.id) return

    map().loaded() ? null : await map().once('render')

    map().removeFeatureState({
      source: source.source,
      sourceLayer: props.style['source-layer'],
    })
    map().setFeatureState(
      {
        source: source.source,
        sourceLayer: props.style['source-layer'],
        id: props.featureState.id,
      },
      props.featureState.state
    )
  })

  return props.children
}

export default Layer
