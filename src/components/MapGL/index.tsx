import {
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  createContext,
  useContext,
  Component,
  createUniqueId,
} from 'solid-js'
import { mapEvents } from '../../events'
import { vectorStyleList } from '../../mapStyles'
import type { mapEventTypes } from '../../events'
import type { MapboxMap, MapboxOptions } from 'mapbox-gl/src/ui/map'
import type { LngLatLike } from 'mapbox-gl/src/geo/lng_lat.js'
import type { LngLatBounds } from 'mapbox-gl/src/geo/lng_lat_bounds.js'
import type { PaddingOptions } from 'mapbox-gl/src/geo/edge_insets.js'
import type { StyleSpecification } from 'mapbox-gl/src/style-spec/types.js'
import type { JSX } from 'solid-js'

export type Viewport = {
  id?: string
  point?: { x: number; y: number }
  center?: LngLatLike
  bounds?: LngLatBounds
  zoom?: number
  pitch?: number
  bearing?: number
  padding?: PaddingOptions
}

type Props = {
  /** ID for the map container element */
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
  /** Event listener for User Interaction */
  onUserInteraction?: (user: boolean) => void
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
  //** Dark Map Style */
  darkStyle?: StyleSpecification | string
  //** Disable automatic map resize */
  disableResize?: boolean
  //** MapLibre library */
  mapLib?: any
  //** APIkey for vector service */
  apikey?: string
  //** Debug Message Mode */
  debug?: boolean
  ref?: HTMLDivElement
  /** Children within the Map Container */
  children?: any
} & mapEventTypes

const MapContext = createContext<MapboxMap>()
/** Provides the Mapbox Map Object */
export const useMap = (): MapboxMap => useContext(MapContext)

/** Creates a new Map Container */
export const MapGL: Component<Props> = props => {
  props.id ??= createUniqueId()

  let map: MapboxMap
  let resizeObserver: ResizeObserver

  const [mapRoot, setMapRoot] = createSignal<MapboxMap>()
  const [darkMode, setDarkMode] = createSignal(false)
  const [userInteraction, setUserInteraction] = createSignal(false)
  // debounce user interactions
  createEffect(() => props.onUserInteraction?.(userInteraction()))

  const debug = (text, value?) => {
    props.debug &&
      console.debug('%c[MapGL]', 'color: #0ea5e9', text, value || '')
  }

  const mapRef = (
    <div
      id={props.id}
      class={props?.class}
      classList={props?.classList}
      style={
        props?.style || props?.class || props?.classList
          ? props.style
          : { position: 'absolute', inset: 0, ...props.style }
      }
    />
  )

  const getStyle = (light, dark) => {
    const style = darkMode() ? dark || light : light
    return typeof style === 'string' || style instanceof String
      ? style
          ?.split(':')
          .reduce((p, c) => p && p[c], vectorStyleList)
          ?.replace(
            '{apikey}',
            //@ts-ignore
            props.apikey || import.meta.env.VITE_VECTOR_API_KEY
          ) || style
      : style || { version: 8, sources: {}, layers: [] }
  }

  onMount(async () => {
    let mapLib = props.mapLib || (await import('mapbox-gl'))
    if (!mapLib.Map) mapLib = window['maplibregl'] || window['mapboxgl']

    if (!mapLib.supported()) throw new Error('Mapbox GL not supported')

    debug(`Map (v${mapLib.version}) loading...`)
    map = new mapLib.Map({
      accessToken:
        //@ts-ignore
        props.options.accessToken || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
      interactive: props.options.interactive || !!props.onViewportChange,
      ...props.options,
      ...props.viewport,
      projection: props.options.projection || 'mercator',
      container: mapRef,
      style: getStyle(props.options?.style, props.darkStyle),
      fitBoundsOptions: { padding: props.viewport?.padding },
    } as MapboxOptions)

    map.mapLib = mapLib
    map.debug = props.debug
    map.sourceIdList = []
    map.layerIdList = []

    map.once('load', () => {
      setMapRoot(map)
      debug('Map loaded')
    })

    // Handle User Interaction
    ;['mousedown', 'touchstart', 'wheel'].forEach(event =>
      map.on(event, () => setUserInteraction(true))
    )
    map.on('moveend', evt => !evt.rotate && setUserInteraction(false))

    // Listen to dark theme changes
    const darkTheme =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)')
    darkTheme?.addEventListener('change', () => {
      setDarkMode(darkTheme.matches)
      debug('Set dark theme to:', darkTheme.matches?.toString())
    })
    new MutationObserver(() => {
      const darkTheme = document.body.classList.contains('dark')
      setDarkMode(darkTheme)
      debug('Set dark theme to:', darkTheme)
    }).observe(document.body, { attributes: true })

    // Listen to map container size changes
    // !props.disableResize &&
    //   new ResizeObserver(() => {
    //     map?.resize()
    //     debug('Map resized')
    //   }).observe(mapRef as Element)

    // Hook up events
    mapEvents.forEach(item => {
      const prop = props[item]
      if (prop) {
        const event = item.slice(2).toLowerCase()
        if (typeof prop === 'function') {
          map.on(event, e => {
            prop(e)
            debug(`Map '${event}' event:`, e)
          })
        } else {
          Object.keys(prop).forEach(layerId => {
            map.on(event, layerId, e => {
              prop[layerId](e)
              debug(`Map '${event}' event on '${layerId}':`, e)
            })
          })
        }
      }
    })

    // Hook up viewport events
    map.on('move', event => {
      const viewport: Viewport = {
        ...props.viewport,
        id: props.id,
        point: { x: event.originalEvent?.x, y: event.originalEvent?.y },
        center: props.viewport.center.lat
          ? map.getCenter()
          : [map.getCenter().lng, map.getCenter().lat],
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      }
      props.onViewportChange && props.onViewportChange(viewport)
    })
  })

  // Update Viewport
  createEffect(() => {
    const viewport = {
      ...props.viewport,
      padding: props.viewport?.padding || 0,
    }
    if (!map || props.id === props.viewport?.id || userInteraction()) return
    map?.stop()[props.transitionType || 'flyTo'](viewport)
    debug(`Update Viewport (${props.transitionType || 'flyTo'}):`, viewport)
  })

  // Update boundaries
  createEffect(prev => {
    const bounds = props.viewport?.bounds
    if (map && bounds && prev !== bounds && !userInteraction()) {
      props.onViewportChange({
        ...props.viewport,
        ...map?.cameraForBounds(bounds, {
          padding: props.viewport?.padding,
        }),
      })
      debug(`Update Viewport Boundaries:`, bounds)
    }
    return bounds
  }, props.viewport?.bounds)

  // Update Projection
  createEffect(prev => {
    const proj = props.options?.projection
    if (!map || prev === proj) return
    map.setProjection(proj)
    debug('Set Projection to:', proj)
    return proj
  }, props.options?.projection)

  // Update cursor
  createEffect(() => {
    if (!props.cursorStyle || !map) return
    map.getCanvas().style.cursor = props.cursorStyle
    debug('Set Cursor to:', props.cursorStyle)
  })

  const insertLayers = (list, layers) => {
    layers.forEach(layer => {
      const index = list.findIndex(i =>
        layer.metadata.smg.beforeType
          ? i.type === layer.metadata.smg.beforeType
          : i.id === layer.metadata.smg.beforeId
      )
      list =
        index === -1
          ? [...list, layer]
          : [...list.slice(0, index), layer, ...list.slice(index + 1)]
    })
    return list
  }

  // Update map style
  createEffect(prev => {
    const style = getStyle(props.options?.style, props.darkStyle)
    if (map?.isStyleLoaded() && prev !== style) {
      const oldStyle = map.getStyle()
      const oldLayers = oldStyle.layers.filter(l =>
        map.layerIdList.includes(l.id)
      )
      const oldSources = Object.keys(oldStyle.sources)
        .filter(s => map.sourceIdList.includes(s))
        .reduce((obj, key) => ({ ...obj, [key]: oldStyle.sources[key] }), {})

      map.setStyle(style)
      map.once('styledata', () => {
        if (!oldLayers) return
        const newStyle = map.getStyle()
        map.setStyle({
          ...newStyle,
          sources: { ...newStyle.sources, ...oldSources },
          layers: insertLayers(newStyle.layers, oldLayers),
        })
      })
      debug('Set Mapstyle to:', style)
    }
    return style
  }, props.options?.style)

  // Update debug features
  ;[
    'showTileBoundaries',
    'showTerrainWireframe',
    'showCollisionBoxes',
    'showPadding',
    'showOverdrawInspector',
  ].forEach(item => {
    createEffect(() => {
      const prop = props[item]
      if (!map) return
      map[item] = prop
      debug(`Set ${item} to:`, prop)
    })
  })

  onCleanup(() => {
    resizeObserver?.disconnect()
    map?.remove()
    debug('Map removed')
  })

  return (
    <MapContext.Provider value={[mapRoot, userInteraction, debug]}>
      {mapRoot() && props.children}
      {mapRef}
    </MapContext.Provider>
  )
}
