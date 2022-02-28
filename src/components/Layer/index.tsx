import {
  onMount,
  onCleanup,
  createEffect,
  Component,
  createUniqueId,
} from 'solid-js'
import { useMap } from '../MapGL'
import { useSource } from '../Source'
import { layerEvents } from '../../events'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type {
  FilterSpecification,
  StyleSpecification,
  SourceSpecification,
} from 'mapbox-gl/src/style-spec/types.js'
import type { CustomLayerInterface } from 'mapbox-gl/src/style/style_layer/custom_style_layer'

const diff = (
  newProps: StyleSpecification = {},
  prevProps: StyleSpecification = {}
) => {
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
        source: source.id,
      },
      props.beforeType
        ? map()
            .getStyle()
            .layers.find(l => l.type === props.beforeType).id
        : props.beforeId
    )
  })

  onCleanup(() => {
    const layer = map().getLayer(props.id)
    if (!layer) return
    layerEvents.forEach(item => {
      props[item] && layer.off(item.slice(2).toLowerCase(), e => props[item](e))
    })
    map().removeLayer(props.id)
  })

  // Hook up events
  createEffect(() =>
    layerEvents.forEach(item => {
      if (props[item]) {
        const eventString = item.slice(2).toLowerCase()
        map()
          .off(eventString, props.id, e => props[item](e))
          .on(eventString, props.id, e => props[item](e))
      }
    })
  )

  // Update Style
  createEffect((prev: StyleSpecification) => {
    if (
      !props.style ||
      !map().style ||
      !map().getSource(source.id) ||
      !map().getLayer(props.id)
    )
      return

    if (props.style.layout !== prev?.layout)
      diff(props.style.layout, prev?.layout).forEach(([key, value]) =>
        map().setLayoutProperty(props.id, key, value, { validate: false })
      )

    if (props.style.paint !== prev?.paint)
      diff(props.style.paint, prev?.paint).forEach(([key, value]) =>
        map().setPaintProperty(props.id, key, value, { validate: false })
      )

    if (
      props.style.minzoom !== prev?.minzoom ||
      props.style.maxzoom !== prev?.maxzoom
    )
      map().setLayerZoomRange(
        props.id,
        props.style.minzoom,
        props.style.maxzoom
      )

    if (props.style.filter !== prev?.filter)
      map().setFilter(props.id, props.style.filter, { validate: false })

    return props.style
  }, props.style)

  // Update Visibility
  createEffect((prev: boolean) => {
    if (
      props.visible === undefined ||
      props.visible === prev ||
      !map().getSource(source.id) ||
      !map().getLayer(props.id)
    )
      return

    map().setLayoutProperty(
      props.id,
      'visibility',
      props.visible ? 'visible' : 'none',
      { validate: false }
    )
    return props.visible
  }, props.visible)

  // Update Filter
  createEffect(async () => {
    if (!props.filter) return

    !map().isStyleLoaded() && (await map().once('styledata'))
    map().setFilter(props.id, props.filter)
  })

  // Update Feature State
  createEffect(async () => {
    if (!props.featureState || !props.featureState.id) return

    !map().isStyleLoaded() && (await map().once('styledata'))

    map().removeFeatureState({
      source: source.id,
      sourceLayer: props.style['source-layer'],
    })
    map().setFeatureState(
      {
        source: source.id,
        sourceLayer: props.style['source-layer'],
        id: props.featureState.id,
      },
      props.featureState.state
    )
  })

  return props.children
}

export default Layer
