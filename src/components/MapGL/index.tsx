import {
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  Component,
  createUniqueId,
  on,
} from 'solid-js'
import { MapProvider } from '../MapProvider'
import { mapEvents } from '../../events'
import { vectorStyleList } from '../../mapStyles'
import type { mapEventTypes } from '../../events'
import type mapboxgl from 'mapbox-gl'
import type { MapboxOptions } from 'mapbox-gl/src/ui/map'
import type { LngLatLike } from 'mapbox-gl/src/geo/lng_lat.js'
import type { LngLatBounds } from 'mapbox-gl/src/geo/lng_lat_bounds.js'
import type { PaddingOptions } from 'mapbox-gl/src/geo/edge_insets.js'
import type { StyleSpecification } from 'mapbox-gl/src/style-spec/types.js'
import type { JSX } from 'solid-js'

export type Map = mapboxgl.Map & {
  mapLib: any
  debug: boolean
  sourceIdList: string[]
  layerIdList: string[]
}

export type Viewport = {
  id?: string
  point?: { x: number; y: number }
  center?: LngLatLike
  bounds?: LngLatBounds
  zoom?: number
  pitch?: number
  bearing?: number
  padding?: PaddingOptions
  inTransit?: boolean
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

/** Creates a new Map Container */
export const MapGL: Component<Props> = (props) => {
  props.id ??= createUniqueId()

  let map: Map
  let mapRef: HTMLDivElement
  let resizeObserver: ResizeObserver
  let mutationObserver: MutationObserver

  const [mapLoaded, setMapLoaded] = createSignal(null)
  const [darkMode, setDarkMode] = createSignal(
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches) ||
      (typeof document !== 'undefined' &&
        document.body.classList.contains('dark'))
  )
  const [internal, setInternal] = createSignal(false)

  const debug = (text, value?) => {
    props.debug &&
      console.debug('%c[MapGL]', 'color: #0ea5e9', text, value || '')
  }

  const getStyle = (light, dark) => {
    const style = darkMode() && dark ? dark : light
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

    if (!mapLib.supported?.()) throw new Error('Mapbox GL not supported')

    debug(`Map (v${mapLib.version}) loading...`)
    map = new mapLib.Map({
      accessToken:
        //@ts-ignore
        props.options?.accessToken || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
      interactive: props.options?.interactive || !!props.onViewportChange,
      ...props.options,
      ...props.viewport,
      projection: props.options?.projection,
      container: mapRef,
      style: getStyle(props.options?.style, props.darkStyle),
      fitBoundsOptions: { padding: props.viewport?.padding },
    } as MapboxOptions)

    map.mapLib = mapLib
    map.debug = props.debug
    map.sourceIdList = []
    map.layerIdList = []

    map.once('load', () => {
      setMapLoaded(map)
      debug('Map loaded')

      // Handle User Interaction
      ;['mousedown', 'touchstart', 'wheel'].forEach((event) =>
        map.on(event, (evt) => !evt.rotate && props.onUserInteraction(true))
      )
      ;['moveend', 'mouseup', 'touchend'].forEach((event) =>
        map.on(event, (evt) => !evt.rotate && props.onUserInteraction(false))
      )

      // Listen to dark theme changes
      const darkTheme =
        typeof window !== 'undefined' &&
        window?.matchMedia('(prefers-color-scheme: dark)')
      darkTheme?.addEventListener('change', () => {
        setDarkMode(darkTheme.matches)
        debug('Set dark theme to:', darkTheme.matches?.toString())
      })
      mutationObserver = new MutationObserver(() => {
        const darkTheme = document.body.classList.contains('dark')
        setDarkMode(darkTheme)
        debug('Set theme to:', darkTheme)
      })
      mutationObserver.observe(document.body, { attributes: true })

      // Listen to map container size changes
      // if (!props.disableResize) {
      //   resizeObserver = new ResizeObserver(() => {
      //     map?.resize()
      //     debug('Map resized')
      //   })
      //   resizeObserver.observe(mapRef as Element)
      // }

      // Hook up events
      mapEvents.forEach((item) => {
        const prop = props[item]
        let isFirstMessage = true
        if (prop) {
          const event = item.slice(2).toLowerCase()
          if (typeof prop === 'function') {
            map.on(event, (e) => {
              prop(e)
              isFirstMessage && debug(`Map '${event}' event:`, e)
              isFirstMessage = false
            })
          } else {
            Object.keys(prop).forEach((layerId) => {
              map.on(event as any, layerId, (e) => {
                prop[layerId](e)
                isFirstMessage &&
                  debug(`Map '${event}' event on '${layerId}':`, e)
                isFirstMessage = false
              })
            })
          }
        }
      })

      // Update Viewport
      map.on('move', (event) => {
        const viewport: Viewport = {
          ...props.viewport,
          id: props.id,
          // point: { x: event.originalEvent?.x, y: event.originalEvent?.y },
          center: props.viewport?.center?.lat
            ? map.getCenter()
            : [map.getCenter().lng, map.getCenter().lat],
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
          inTransit: true,
        }
        setInternal(true)
        !event.viewport && props.onViewportChange?.(viewport)
      })

      map.on('moveend', (event) => {
        !event.rotate &&
          props.onViewportChange?.({ ...props.viewport, inTransit: false })
        setInternal(false)
      })
    })
  })

  // Hook up viewport event
  createEffect(
    on(
      () => props.viewport,
      (vp) => {
        if (props.id !== vp?.id || internal()) return
        const viewport = {
          ...vp,
          ...(vp.bounds
            ? map.cameraForBounds(vp.bounds, {
                padding: vp?.padding,
              })
            : null),
        }
        map.stop()[props.transitionType || 'flyTo'](viewport)
        debug(`Update Viewport (${props.transitionType || 'flyTo'}):`, viewport)
      },
      { defer: true }
    )
  )

  // Update Projection
  createEffect(() => {
    const proj = props.options?.projection
    if (!map || !proj) return
    map.setProjection(proj)
    debug('Set Projection to:', proj)
  })

  // Update Cursor
  createEffect(() => {
    const cur = props.cursorStyle
    if (!map || !cur) return
    map.getCanvas().style.cursor = cur
    debug('Set Cursor to:', cur)
  })

  const insertLayers = (list, layers) => {
    layers.forEach((layer) => {
      const index = list.findIndex((i) =>
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
  createEffect((prev) => {
    const style = getStyle(props.options?.style, props.darkStyle)
    if (map?.isStyleLoaded() && prev !== style) {
      const oldStyle = map.getStyle()
      const oldLayers = oldStyle.layers.filter((l) =>
        map.layerIdList.includes(l.id)
      )
      const oldSources = Object.keys(oldStyle.sources)
        .filter((s) => map.sourceIdList.includes(s))
        .reduce((obj, key) => ({ ...obj, [key]: oldStyle.sources[key] }), {})

      map.setStyle(style)
      map.once('styledata', () => {
        if (!oldLayers) return
        const newStyle = map.getStyle()
        map.setStyle({
          ...newStyle,
          sources: { ...newStyle.sources, ...oldSources },
          layers: insertLayers(newStyle.layers, oldLayers),
          fog: oldStyle.fog,
          terrain: oldStyle.terrain,
        })
        debug('Set Mapstyle to:', style)
      })
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
  ].forEach((item) => {
    createEffect(() => {
      const prop = props[item]
      if (!map || !prop) return
      map[item] = prop
      debug(`Set ${item} to:`, prop)
    })
  })

  onCleanup(() => {
    resizeObserver?.disconnect()
    mutationObserver?.disconnect()
    map?.remove()
    debug('Map removed')
  })

  return (
    <>
      <div
        ref={mapRef}
        id={props.id}
        class={props?.class}
        classList={props?.classList}
        style={
          props?.class || props?.classList
            ? null
            : props.style || {
                position: 'absolute',
                inset: 0,
                'z-index': -1,
              }
        }
      />
      {mapLoaded() && (
        <MapProvider map={mapLoaded()}>{props.children}</MapProvider>
      )}
    </>
  )
}
