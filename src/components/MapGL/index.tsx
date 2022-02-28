import {
  createEffect,
  onMount,
  onCleanup,
  createContext,
  useContext,
  Component,
  useTransition,
} from 'solid-js'
import { mapEvents, viewportEvents } from '../../events'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type MapboxOptions from 'mapbox-gl/src/ui/map'
import type MapMouseEvent from 'mapbox-gl/src/ui/events'
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
  onMouseMove?: (event: MapMouseEvent) => void
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

  onCleanup(() => {
    mapEvents.forEach(item => {
      props[item] && map.off(item.slice(2).toLowerCase(), e => props[item](e))
    })
    map.remove()
  })

  // Hook up events
  createEffect(() =>
    mapEvents.forEach(item => {
      if (props[item]) {
        const eventString = item.slice(2).toLowerCase()
        map
          .off(eventString, e => props[item](e))
          .on(eventString, e => props[item](e))
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
    prev => prev !== props.options.style && map.setStyle(props.options.style),
    props.options.style
  )

  // Update Viewport
  createEffect(() => {
    props.onViewportChange &&
      viewportEvents.forEach(item =>
        map.on(item, evt => {
          if (!evt.originalEvent) return
          props.onViewportChange({
            center: map.getCenter(),
            zoom: map.getZoom(),
            pitch: map.getPitch(),
            bearing: map.getBearing(),
            padding: props.viewport.padding,
            bounds: props.viewport.bounds,
          })
        })
      )
  })

  // Update boundaries
  createEffect(prev => {
    if (props.viewport.bounds != prev) {
      const camera = map.cameraForBounds(props.viewport.bounds, {
        padding: props.viewport.padding,
      })
      props.onViewportChange({
        ...props.viewport,
        ...camera,
      })
    }
    return props.viewport.bounds
  }, props.viewport.bounds)

  createEffect(async (prev: Viewport) => {
    const viewport: Viewport = props.viewport
    const newViewport: Viewport = {
      ...(viewport.zoom != prev.zoom && { zoom: viewport.zoom }),
      ...(viewport.padding != prev.padding && { padding: viewport.padding }),
      ...(viewport.bearing != prev.bearing && { bearing: viewport.bearing }),
      ...(viewport.pitch != prev.pitch && { pitch: viewport.pitch }),
      ...(viewport.center != prev.center && {
        center: viewport.center.lng
          ? [viewport.center.lng, viewport.center.lat]
          : viewport.center,
      }),
    }
    if (Object.keys(newViewport).length) {
      map.stop()
      switch (props.transitionType) {
        case 'easeTo':
          map.easeTo(newViewport)
        case 'jumpTo':
          map.jumpTo(newViewport)
        default:
          map.flyTo(newViewport)
      }
    }
    return newViewport
  }, props.viewport)

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
