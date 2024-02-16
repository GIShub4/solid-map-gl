import { onCleanup, createEffect, Component, createUniqueId } from 'solid-js'
import { useMapContext } from '../MapProvider'
import { useSourceId } from '../Source'
import { layerEvents } from '../../events'
import { baseStyle, layoutStyles } from '../../styles'
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
  slot?: string
  /** A string that specifies the slot to which the layer belongs. */
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

const newKey = (key, type) =>
  (key.startsWith(type) || key.startsWith('icon') || key.startsWith('text')
    ? ''
    : type + '-') + key.replace(/[A-Z]/g, (s) => '-' + s.toLowerCase())

const updateStyle = (oldStyle) => {
  if (!oldStyle) return
  let layout = {}
  let paint = {}
  let style = {}

  Object.entries(oldStyle).forEach(([key, value]) => {
    if (baseStyle.includes(key)) style[key] = value
    else {
      const nk = newKey(key, oldStyle.type)
      layoutStyles.includes(nk) ? (layout[nk] = value) : (paint[nk] = value)
    }
  })
  if (oldStyle.paint)
    Object.entries(oldStyle.paint).forEach(
      ([key, value]) => (paint[newKey(key, oldStyle.type)] = value)
    )
  if (oldStyle.layout)
    Object.entries(oldStyle.layout).forEach(
      ([key, value]) => (layout[newKey(key, oldStyle.type)] = value)
    )
  return { ...style, paint, layout } as StyleSpecification
}

export const Layer: Component<Props> = (props) => {
  const [ctx] = useMapContext()
  const sourceId: string = props.style?.source || useSourceId()
  props.id = props.id || props.customLayer?.id || createUniqueId()

  const debug = (text, value?) => {
    ;(ctx.map.debug || ctx.map.debugEvents) &&
      console.debug('%c[MapGL]', 'color: #10b981', text, value || '')
  }

  // Add Layer
  ctx.map.addLayer(
    props.customLayer || {
      ...updateStyle(props.style),
      id: props.id,
      source: sourceId,
      slot: props.slot,
      metadata: {
        smg: { beforeType: props.beforeType, beforeId: props.beforeId },
      },
    },
    props.beforeType
      ? ctx.map.getStyle().layers.find((l) => l.type === props.beforeType)?.id
      : props.beforeId
  )
  ctx.map.layerIdList.push(props.id)
  if (props.customLayer) ctx.map.fire('load')
  debug('Add Layer:', props.id)

  // Hook up events
  layerEvents.forEach((item) => {
    if (props[item]) {
      const event = item.slice(2).toLowerCase()
      ctx.map.on(event, props.id, (evt) => {
        evt.clickOnLayer = true
        props[item](evt)
        ctx.map.debugEvent &&
          debug(`Layer '${event}' event on '${props.id}':`, evt)
      })
    }
  })

  // Update Style
  createEffect((prev: StyleSpecification) => {
    const style = updateStyle(props.style)
    if (style === prev) return

    if (style.layout !== prev?.layout)
      diff(style.layout, prev?.layout).forEach(([key, value]) =>
        ctx.map.setLayoutProperty(props.id, key, value, { validate: false })
      )

    if (style.paint !== prev?.paint)
      diff(style.paint, prev?.paint).forEach(([key, value]) =>
        ctx.map.setPaintProperty(props.id, key, value, { validate: false })
      )

    if (style.minzoom !== prev?.minzoom || style.maxzoom !== prev?.maxzoom)
      ctx.map.setLayerZoomRange(props.id, style.minzoom, style.maxzoom)

    if (style.filter !== prev?.filter)
      ctx.map.setFilter(props.id, style.filter, { validate: false })

    debug('Update Layer Style:', props.id)
    return style
  }, updateStyle(props.style))

  // Update Visibility
  createEffect((prev: boolean) => {
    if (props.visible === prev) return

    ctx.map.setLayoutProperty(
      props.id,
      'visibility',
      props.visible ? 'visible' : 'none',
      { validate: false }
    )
    debug(`Update Visibility (${props.id}):`, props.visible.toString())
    return props.visible
  }, props.visible)

  // Update Filter
  createEffect(async () => {
    if (!props.filter) return

    !ctx.map.isStyleLoaded() && (await ctx.map.once('styledata'))
    ctx.map.setFilter(props.id, props.filter)
    debug(`Update Filter (${props.id}):`, props.filter)
  })

  // Update Feature State
  createEffect(async () => {
    if (!props.featureState || props.featureState.id === null) return

    !ctx.map.isStyleLoaded() && (await ctx.map.once('styledata'))

    ctx.map.removeFeatureState({
      source: sourceId,
      sourceLayer: props.style['source-layer'],
    })
    ctx.map.setFeatureState(
      {
        source: sourceId,
        sourceLayer: props.style['source-layer'],
        id: props.featureState.id,
      },
      props.featureState.state
    )
  })

  //Remove Layer
  onCleanup(() => ctx.map?.getLayer(props.id) && ctx.map?.removeLayer(props.id))

  return props.children
}
