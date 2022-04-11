import {
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  createContext,
  useContext,
  Component,
  useTransition,
  createUniqueId,
  untrack,
  on,
} from 'solid-js'
import { mapEvents } from '../../events'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { MapboxMap, MapboxOptions } from 'mapbox-gl/src/ui/map'
import type { LngLatLike } from 'mapbox-gl/src/geo/lng_lat.js'
import type { LngLatBounds } from 'mapbox-gl/src/geo/lng_lat_bounds.js'
import type { PaddingOptions } from 'mapbox-gl/src/geo/edge_insets.js'
import type { JSX } from 'solid-js'

export type Viewport = {
  id?: string
  center?: LngLatLike
  bounds?: LngLatBounds
  zoom?: number
  pitch?: number
  bearing?: number
  padding?: PaddingOptions
}

const [pending, start] = useTransition()
const [transitionType, setTransitionType] = createSignal('flyTo')

const MapContext = createContext<MapboxMap>()
const useMap = () => useContext(MapContext)

const MapGL: Component<{
  id?: string
  style?: JSX.CSSProperties
  class?: string
  classList?: {
    [k: string]: boolean | undefined
  }
  viewport?: Viewport
  options?: MapboxOptions
  children?: Element | Element[]
  triggerResize?: boolean
  transitionType?: 'flyTo' | 'easeTo' | 'jumpTo'
  onViewportChange?: (viewport: Viewport) => void
  showTileBoundaries?: boolean
  showTerrainWireframe?: boolean
  showPadding?: boolean
  showCollisionBoxes?: boolean
  showOverdrawInspector?: boolean
  repaint?: boolean
  cursorStyle?: string
  ref?: HTMLDivElement
}> = props => {
  let map: MapboxMap
  let mapRef: HTMLDivElement
  let containerRef: HTMLElement
  props.id = props.id || createUniqueId()

  onMount(() => {
    map = new mapboxgl.Map({
      ...props.options,
      style: props.options?.style || { version: 8, sources: {}, layers: [] },
      container: mapRef,
      interactive: !!props.onViewportChange,
      bounds: props.viewport?.bounds,
      center: props.viewport?.center,
      zoom: props.viewport?.zoom || null,
      pitch: props.viewport?.pitch || null,
      bearing: props.viewport?.bearing || null,
      fitBoundsOptions: { padding: props.viewport?.padding },
    } as MapboxOptions)

    map.container = containerRef
  })

  onCleanup(() => map.remove())

  // Hook up events
  createEffect(() =>
    mapEvents.forEach(item => {
      if (props[item]) {
        const event = item.slice(2).toLowerCase()
        const callback = e => props[item](e)
        map.on(event, callback)
        onCleanup(() => map.off(event, callback))
      }
    })
  )

  // Update debug features
  createEffect(() => (map.showTileBoundaries = props.showTileBoundaries))
  createEffect(() => (map.showTerrainWireframe = props.showTerrainWireframe))
  createEffect(() => (map.showPadding = props.showPadding))
  createEffect(() => (map.showCollisionBoxes = props.showCollisionBoxes))
  createEffect(() => (map.showOverdrawInspector = props.showOverdrawInspector))
  createEffect(() => (map.getCanvas().style.cursor = props.cursorStyle))

  // Update map style
  createEffect(
    on(
      () => props.options.style,
      () => {
        const oldStyle = map.getStyle()
        const oldLayers = oldStyle.layers.filter(l => l.id.startsWith('cl-'))
        const oldSources = Object.keys(oldStyle.sources)
          .filter(s => s.startsWith('cl-'))
          .reduce((obj, key) => ({ ...obj, [key]: oldStyle.sources[key] }), {})
        map.setStyle(props.options.style)
        map.once('styledata', () => {
          const newStyle = map.getStyle()
          map.setStyle({
            ...newStyle,
            sources: { ...newStyle.sources, ...oldSources },
            layers: [...newStyle.layers, ...oldLayers],
          })
        })
      },
      { defer: true }
    )
  )

  // Update projection
  createEffect(
    on(
      () => props.options.projection,
      () => map.setProjection(props.options.projection),
      { defer: true }
    )
  )

  createEffect(() => setTransitionType(props.transitionType))

  // Hook up viewport events
  createEffect(() => {
    const viewport = {
      id: null,
      center: map.getCenter(),
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      padding: props.viewport?.padding,
      bounds: props.viewport?.bounds,
    }

    const callMove = event => {
      if (event.originalEvent)
        props.onViewportChange &&
          props.onViewportChange({ ...viewport, id: props.id })
      setTransitionType('jumpTo')
    }

    const callEnd = event => {
      if (event.originalEvent)
        props.onViewportChange && props.onViewportChange(viewport)
      setTransitionType(props.transitionType)
    }

    map.on('move', callMove).on('moveend', callEnd)
    onCleanup(() => map.off('move', callMove).off('moveend', callEnd))
  })

  // Update boundaries
  createEffect(prev => {
    if (props.viewport?.bounds != prev)
      props.onViewportChange({
        ...props.viewport,
        ...map.cameraForBounds(props.viewport?.bounds, {
          padding: props.viewport?.padding,
        }),
      })
    return props.viewport?.bounds
  }, props.viewport?.bounds)

  // Update Viewport
  createEffect(() => {
    if (props.id === props.viewport?.id) return
    const viewport = {
      ...props.viewport,
      padding: props.viewport?.padding || 0,
    }
    switch (untrack(transitionType)) {
      case 'easeTo':
        map.stop().easeTo(viewport)
      case 'jumpTo':
        map.stop().jumpTo(viewport)
      default:
        map.stop().flyTo(viewport)
    }
  })

  let index = 0

  createEffect(() => {
    if (props.triggerResize) {
      index = 0
      window.requestAnimationFrame(function loop() {
        if (index < 15) {
          index++
          window.requestAnimationFrame(loop)
          start(() => map.resize())
        }
      })
    }
  })

  return (
    <MapContext.Provider value={() => map}>
      <section
        ref={containerRef}
        style={{ position: 'absolute', 'z-index': 1 }}>
        {props.children}
      </section>
      <div
        ref={mapRef}
        class={props.class || ''}
        classList={props.classList}
        style={{ height: '100%', width: '100%', ...props.style }}
      />
    </MapContext.Provider>
  )
}

export { MapGL as default, useMap }
