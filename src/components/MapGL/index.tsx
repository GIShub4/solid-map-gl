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
import { vectorStyleList } from '../../styles'
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

const MapContext = createContext<MapboxMap>()
/** Provides the Mapbox Map Object */
export const useMap = (): MapboxMap => useContext(MapContext)

/** Creates a new Map Container */
export const MapGL: Component<{
  id?: string
  /** Map Container CSS Style */
  style?: JSX.CSSProperties
  /** Map Container CSS Class */
  class?: string
  /** SolidJS Class List for Map Container */
  classList?: {
    [k: string]: boolean | undefined
  }
  /** Current Map View */
  viewport?: Viewport
  /** Mapbox Options
   * @see https://docs.mapbox.com/mapbox-gl-js/api/map/#map-parameters
   */
  options?: MapboxOptions
  /** Type for pan, move and zoom transitions */
  transitionType?: 'flyTo' | 'easeTo' | 'jumpTo'
  /** Event listener for Viewport updates */
  onViewportChange?: (viewport: Viewport) => void
  /** Displays Map Tile Borders */
  showTileBoundaries?: boolean
  /** Displays Wireframe if Terrain is visible */
  showTerrainWireframe?: boolean
  /** Displays Borders if Padding is set */
  showPadding?: boolean
  /** Displays Label Collision Boxes */
  showCollisionBoxes?: boolean
  /** Displays all feature outlines even if normally not drawn by style rules */
  showOverdrawInspector?: boolean
  /** Mouse Cursor Style */
  cursorStyle?: string
  ref?: HTMLDivElement
  /** Children within the Map Container */
  children?: Element | Element[] | null
}> = props => {
  props.id = props.id || createUniqueId()

  const [mapRoot, setMapRoot] = createSignal<MapboxMap>(null)
  const [pending, start] = useTransition()
  const [transitionType, setTransitionType] = createSignal('flyTo')

  const mapRef = (
    <div
      class={props?.class}
      classList={props?.classList}
      style={{ position: 'absolute', inset: 0, ...props.style }}
    />
  )

  onMount(() => {
    const map: MapboxMap = new mapboxgl.Map({
      ...props.options,
      style: vectorStyleList[props.options?.style] ||
        props.options?.style || { version: 8, sources: {}, layers: [] },
      container: mapRef,
      interactive: !!props.onViewportChange,
      bounds: props.viewport?.bounds,
      center: props.viewport?.center,
      zoom: props.viewport?.zoom || null,
      pitch: props.viewport?.pitch || null,
      bearing: props.viewport?.bearing || null,
      fitBoundsOptions: { padding: props.viewport?.padding },
    } as MapboxOptions)

    // map.container = containerRef

    map.once('styledata').then(() => setMapRoot(map))

    onCleanup(() => map.remove())

    // Listen to map container size changes
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(mapRef as Element)

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
    createEffect(() => {
      map.showTileBoundaries = props.showTileBoundaries
      map.showTerrainWireframe = props.showTerrainWireframe
      map.showPadding = props.showPadding
      map.showCollisionBoxes = props.showCollisionBoxes
      map.showOverdrawInspector = props.showOverdrawInspector
    })

    // Update cursor
    createEffect(() => (map.getCanvas().style.cursor = props.cursorStyle))
    //Update transition type
    createEffect(() => setTransitionType(props.transitionType))
    // Update projection
    createEffect(() => map.setProjection(props.options?.projection))

    // Update map style
    createEffect(() => {
      const style = props.options?.style
      if (!map.isStyleLoaded()) return
      const oldStyle = map.getStyle()
      const oldLayers = oldStyle.layers.filter(l => l.id.startsWith('cl-'))
      const oldSources = Object.keys(oldStyle.sources)
        .filter(s => s.startsWith('cl-'))
        .reduce((obj, key) => ({ ...obj, [key]: oldStyle.sources[key] }), {})
      map.setStyle(
        vectorStyleList[style] ||
          style || { version: 8, sources: {}, layers: [] }
      )
      map.once('styledata', () => {
        const newStyle = map.getStyle()
        map.setStyle({
          ...newStyle,
          sources: { ...newStyle.sources, ...oldSources },
          layers: [...newStyle.layers, ...oldLayers],
        })
      })
    })

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
  })

  return (
    <MapContext.Provider value={mapRoot}>
      {mapRoot() && (
        <div style={{ position: 'absolute', 'z-index': 10 }}>
          {props.children}
        </div>
      )}
      {mapRef}
    </MapContext.Provider>
  )
}
