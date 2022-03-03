import {
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  createContext,
  useContext,
  Component,
  useTransition,
} from 'solid-js'
import { mapEvents } from '../../events'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type MapboxOptions from 'mapbox-gl/src/ui/map'
import type { LngLatLike } from 'mapbox-gl/src/geo/lng_lat.js'
import type { LngLatBounds } from 'mapbox-gl/src/geo/lng_lat_bounds.js'
import type { PaddingOptions } from 'mapbox-gl/src/geo/edge_insets.js'

export type Viewport = {
  center?: LngLatLike
  bounds?: LngLatBounds
  zoom?: number
  pitch?: number
  bearing?: number
  padding?: PaddingOptions
}

const [pending, start] = useTransition()
const [isInternal, setInternal] = createSignal(false)

const MapContext = createContext<MapboxMap>()
const useMap = () => useContext(MapContext)

const MapGL: Component<{
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
}> = props => {
  let map: MapboxMap
  let mapRef: HTMLDivElement

  onMount(() => {
    map = new mapboxgl.Map({
      ...props.options,
      container: mapRef,
      interactive: !!props.onViewportChange,
      bounds: props.viewport.bounds,
      center: props.viewport.center,
      zoom: props.viewport.zoom || null,
      pitch: props.viewport.pitch || null,
      bearing: props.viewport.bearing || null,
      fitBoundsOptions: { padding: props.viewport.padding },
    } as MapboxOptions)
  })

  onCleanup(() => map.remove())

  // Hook up events
  createEffect(() =>
    mapEvents.forEach(item => {
      if (props[item]) {
        const event = item.slice(2).toLowerCase()
        const callback = e => props[item](e)
        map.on(event, callback)
        onCleanup(() => map().off(event, callback))
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
  createEffect(prev => {
    prev !== props.options.style && map.setStyle(props.options.style)
  }, props.options.style)

  // Update projection
  createEffect(prev => {
    prev !== props.options.projection &&
      map.setProjection(props.options.projection)
  }, props.options.projection)

  // Hook up viewport events
  createEffect(() => {
    const callback = event => {
      if (event.originalEvent) {
        setInternal(true)
        props.onViewportChange({
          center: map.getCenter(),
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
          padding: props.viewport.padding,
          bounds: props.viewport.bounds,
        })
      }
    }
    const callEnd = event => setInternal(false)

    map.on('move', callback).on('moveend', callEnd)
    onCleanup(() => map.off('move', callback).off('moveend', callEnd))
  })

  // Update boundaries
  createEffect(prev => {
    if (props.viewport.bounds != prev)
      props.onViewportChange({
        ...props.viewport,
        ...map.cameraForBounds(props.viewport.bounds, {
          padding: props.viewport.padding,
        }),
      })
    return props.viewport.bounds
  }, props.viewport.bounds)

  // Update Viewport
  createEffect(() => {
    if (isInternal()) return
    switch (props.transitionType) {
      case 'easeTo':
        map.stop().easeTo(props.viewport)
      case 'jumpTo':
        map.stop().jumpTo(props.viewport)
      default:
        map.stop().flyTo(props.viewport)
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
      {props.children}
      <section
        ref={mapRef}
        class={props.class || ''}
        classList={props.classList}
        style={{ height: '100%', width: '100%' }}></section>
    </MapContext.Provider>
  )
}

export { MapGL as default, useMap }
