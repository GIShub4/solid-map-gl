import { onCleanup, createEffect, Component, createUniqueId } from 'solid-js'
import { useMap } from '../MapGL'
import { useSourceId } from '../Source'
import { layerEvents } from '../../events'
import type { layerEventTypes } from '../../events'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type {
  FilterSpecification,
  StyleSpecification,
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

export const Layer: Component<
  {
    id?: string
    style?: StyleSpecification
    customLayer?: CustomLayerInterface
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
    children?: any
  } & layerEventTypes
> = props => {
  const map: MapboxMap = useMap()
  const sourceId: string = useSourceId()
  props.id = props.id || createUniqueId()

  //Remove Layer
  onCleanup(
    () => map && map().getLayer(props.id) && map().removeLayer(props.id)
  )

  // Hook up events
  createEffect(() =>
    layerEvents.forEach(item => {
      if (props[item]) {
        const event = item.slice(2).toLowerCase()
        const callback = e => props[item](e)
        map()?.on(event, props.id, callback)
        onCleanup(() => map()?.off(event, props.id, callback))
      }
    })
  )

  // Update Style
  createEffect((prev: StyleSpecification) => {
    if (
      !props.style ||
      !map().style ||
      !map().getSource(sourceId) ||
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
      !map().getSource(sourceId) ||
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

  // Add Layer
  createEffect(() => {
    !map().getLayer(props.id) &&
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
              ?.getStyle()
              .layers.find(l => l.type === props.beforeType)?.id
          : props.beforeId
      )
  })

  return props.children
}
