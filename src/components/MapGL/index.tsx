import {
  createEffect,
  onMount,
  onCleanup,
  createContext,
  useContext,
  Component,
  useTransition,
} from 'solid-js'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type MapboxOptions from 'mapbox-gl/src/ui/map'
import type MapMouseEvent from 'mapbox-gl/src/ui/events'
import type { LngLatLike } from 'mapbox-gl/src/geo/lng_lat.js'
import type { LngLatBounds } from 'mapbox-gl/src/geo/lng_lat_bounds.js'

export type Viewport = {
  center?: LngLatLike
  bounds?: LngLatBounds
  zoom?: number
  pitch?: number
  bearing?: number
  padding?: number
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
  children?: Element[]
  triggerResize?: boolean
  transitionType?: 'flyTo' | 'easeTo' | 'jumpTo'
  onMouseMove?: (event: MapMouseEvent) => void
  onViewportChange?: (viewport: Viewport) => void
}> = props => {
  let map: MapboxMap
  let mapRef: HTMLElement

  onCleanup(() => map.remove())

  onMount(() => {
    map = new mapboxgl.Map({
      ...props.options,
      container: mapRef,
      bounds: props.viewport.bounds,
      center: props.viewport.center,
      zoom: props.viewport.zoom || null,
      pitch: props.viewport.pitch || null,
      bearing: props.viewport.bearing || null,
      fitBoundsOptions: { padding: props.viewport.padding },
    } as MapboxOptions)
  })

  createEffect(
    () =>
      props.onMouseMove &&
      map.on('mousemove', event => props.onMouseMove(event.lngLat))
  )

  const _onViewportChange = evt => {
    if (evt.isInternal) return
    const viewport: Viewport = {
      center: map.getCenter(),
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      padding: props.viewport.padding,
      bounds: props.viewport.bounds,
    }
    props.onViewportChange(viewport)
  }

  createEffect(
    () =>
      props.onViewportChange &&
      map
        .on('dragend', _onViewportChange)
        .on('moveend', _onViewportChange)
        .on('zoomend', _onViewportChange)
        .on('rotateend', _onViewportChange)
        .on('pitchend', _onViewportChange)
        .on('boxzoomend', _onViewportChange)
  )

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
    const vp: Viewport = props.viewport
    const nvp: Viewport = {
      ...(vp.zoom != prev.zoom && { zoom: vp.zoom }),
      ...(vp.padding != prev.padding && { padding: vp.padding }),
      ...(vp.bearing != prev.bearing && { bearing: vp.bearing }),
      ...(vp.pitch != prev.pitch && { pitch: vp.pitch }),
      ...(vp.center != prev.center && {
        center: vp.center.lng ? [vp.center.lng, vp.center.lat] : vp.center,
      }),
    }
    if (Object.keys(nvp).length) {
      map.stop()
      switch (props.transitionType) {
        case 'easeTo':
          map.easeTo(nvp, { isInternal: true })
        case 'jumpTo':
          map.jumpTo(nvp, { isInternal: true })
        default:
          map.flyTo(nvp, { isInternal: true })
      }
    }
    return vp
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
      <>
        {props.children}
        <main
          ref={mapRef}
          class={props.class || ''}
          classList={props.classList}
          style={{ height: '100%', width: '100%' }}></main>
      </>
    </MapContext.Provider>
  )
}

export { MapGL as default, useMap }
