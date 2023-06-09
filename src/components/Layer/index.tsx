import { onCleanup, createEffect, Component, createUniqueId } from 'solid-js'
import { useMap } from '../MapProvider'
import { useSourceId } from '../Source'
import { layerEvents } from '../../events'
import type { layerEventTypes } from '../../events'
import type {
  FilterSpecification,
  StyleSpecification,
} from 'mapbox-gl/src/style-spec/types.js'
import type { CustomLayerInterface } from 'mapbox-gl/src/style/style_layer/custom_style_layer'

const diff = (
  newProps: StyleSpecification = {},
  prevProps: StyleSpecification = {}
): [string, any][] => {
  const keys = new Set([...Object.keys(newProps), ...Object.keys(prevProps)])
  return [...keys].reduce((acc, key: string) => {
    const value = newProps[key]
    if (value !== prevProps[key]) {
      acc.push([key, value])
    }
    return acc
  }, [])
}

type Props = {
  id?: string
  /** A string that uniquely identifies the layer. If not provided, a unique ID will be generated. */
  style?: StyleSpecification
  /** A Mapbox Style Specification object that defines the visual appearance of the layer. */
  customLayer?: CustomLayerInterface
  /** An object that implements the `CustomLayerInterface` interface, which allows you to create custom layers using WebGL. */
  filter?: FilterSpecification
  /** A Mapbox filter specification that defines which features of the layer to include or exclude from the layer. */
  visible?: boolean
  /** A boolean that determines whether the layer is visible or not. */
  sourceId?: string
  /** A string that specifies the ID of the source that the layer uses for its data. */
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
  /** A string that specifies the type of layer before which the current layer should be inserted. */
  beforeId?: string
  /** A string that specifies the ID of the layer before which the current layer should be inserted. */
  featureState?: { id: number | string; state: object }
  /** An object that specifies the state of a feature in the layer. The object consists of an ID (either a number or a string) and an object containing the state. */
  children?: any
  /** Any content that should be rendered within the layer. */
} & layerEventTypes

export const Layer: Component<Props> = props => {
  const [map] = useMap()
  const sourceId: string = props.style?.source || useSourceId()
  props.id ??= createUniqueId()

  const debug = (text, value?) => {
    map().debug &&
      console.debug('%c[MapGL]', 'color: #10b981', text, value || '')
  }

  // Add Layer
  map().addLayer(
    props.customLayer || {
      ...props.style,
      id: props.id,
      source: sourceId,
      metadata: {
        smg: { beforeType: props.beforeType, beforeId: props.beforeId },
      },
    },
    props.beforeType
      ? map()
        .getStyle()
        .layers.find(l => l.type === props.beforeType)?.id
      : props.beforeId
  )
  map().layerIdList.push(props.id)
  debug('Add Layer:', props.id)

  // Hook up events
  layerEvents.forEach(item => {
    if (props[item]) {
      const event = item.slice(2).toLowerCase()
      map().on(event, props.id, evt => {
        props[item](evt)
        debug(`Layer '${event}' event on '${props.id}':`, evt)
      })
    }
  })

  // Update Style
  createEffect((prev: StyleSpecification) => {
    const style = props.style
    if (style === prev) return

    if (style.layout !== prev?.layout)
      diff(style.layout, prev?.layout).forEach(([key, value]) =>
        map().setLayoutProperty(props.id, key, value, { validate: false })
      )

    if (style.paint !== prev?.paint)
      diff(style.paint, prev?.paint).forEach(([key, value]) =>
        map().setPaintProperty(props.id, key, value, { validate: false })
      )

    if (style.minzoom !== prev?.minzoom || style.maxzoom !== prev?.maxzoom)
      map().setLayerZoomRange(props.id, style.minzoom, style.maxzoom)

    if (style.filter !== prev?.filter)
      map().setFilter(props.id, style.filter, { validate: false })

    debug('Update Layer Style:', props.id)
    return style
  }, props.style)

  // Update Visibility
  createEffect((prev: boolean) => {
    if (props.visible === prev) return

    map().setLayoutProperty(
      props.id,
      'visibility',
      props.visible ? 'visible' : 'none',
      { validate: false }
    )
    debug(`Update Visibility (${props.id}):`, props.visible)
    return props.visible
  }, props.visible)

  // Update Filter
  createEffect(async () => {
    if (!props.filter) return

    !map().isStyleLoaded() && (await map().once('styledata'))
    map().setFilter(props.id, props.filter)
    debug(`Update Filter (${props.id}):`, props.filter)
  })

  // Update Feature State
  createEffect(async () => {
    if (!props.featureState || !props.featureState.id) return

    !map().isStyleLoaded() && (await map().once('styledata'))

    map().removeFeatureState({
      source: sourceId,
      sourceLayer: props.style['source-layer'],
    })
    map().setFeatureState(
      {
        source: sourceId,
        sourceLayer: props.style['source-layer'],
        id: props.featureState.id,
      },
      props.featureState.state
    )
  })

  //Remove Layer
  onCleanup(() => map()?.getLayer(props.id) && map()?.removeLayer(props.id))

  return props.children
}
