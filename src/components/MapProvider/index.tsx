import { createContext, useContext, createEffect, ParentComponent } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { Map } from '../MapGL'

type MapContextState = {
  map: Map | null
  /** The resolved Mapbox/MapLibre module in use — replaces the old `window.MapLib` global */
  mapLib: any
  isMapLibre: boolean
  /** Named values (colors, widths, ...) that Layer style props can reference via `"@name"` */
  constants: Record<string, any>
  /** Bumped by MapGL on every matchMedia/dark-class-mutation firing, unconditionally — not a
   * light/dark judgment, just "something in the environment that could affect a resolved CSS
   * value just changed." Layer reads this only to know *when* to re-probe a "bg-x dark:bg-y"
   * color pair, never to decide which of the two applies (the browser's own cascade decides that,
   * see resolveColor in components/Layer/colors.ts) — so it stays correct even for a dark-mode strategy (e.g. a
   * `data-theme` attribute) MapGL's own class-based heuristic wouldn't recognize as "dark" */
  themeVersion: number
}

const defaultState: MapContextState = {
  map: null,
  mapLib: null,
  isMapLibre: false,
  constants: {},
  themeVersion: 0,
}

export const MapContext = createContext<[MapContextState]>([defaultState])

export const useMapContext = () => useContext(MapContext)

export const MapProvider: ParentComponent<{
  map?: Map
  mapLib?: any
  isMapLibre?: boolean
  constants?: Record<string, any>
  themeVersion?: number
}> = (props) => {
  // Store is created per-instance (not module-scoped) so multiple <MapGL>s, even mixing
  // Mapbox/MapLibre, each get their own isolated context value instead of overwriting one global.
  const [state, setState] = createStore<MapContextState>({ ...defaultState })

  props.map && setState('map', props.map)
  setState('isMapLibre', !!props.isMapLibre)
  // Set synchronously (not just in the createEffect below) so a child that reads `ctx.constants`
  // during its own synchronous setup — e.g. Layer's initial `addLayer` call — sees the real value
  // immediately, instead of the `{}` default for one microtask until effects first flush.
  setState('constants', props.constants || {})
  setState('themeVersion', props.themeVersion || 0)

  // A plain-object merge (not `reconcile`, which unwraps its source to a non-reactive snapshot
  // before diffing) so reading `ctx.constants.primary` inside a Layer effect tracks that one
  // signal read here, letting a `constants` prop change re-run only the Layers that reference the
  // changed name — reconcile would silently break that if `constants` is ever a live signal/store
  // read inline (`constants={{ primary: primary() }}`), since it'd read `primary()` untracked.
  createEffect(() => setState('constants', props.constants || {}))
  createEffect(() => setState('themeVersion', props.themeVersion || 0))

  // mapLib is deliberately kept *out* of the store. A bundled mapbox-gl/maplibre-gl module is a
  // plain object (or null-prototype namespace), which solid-js/store treats as wrappable: reading
  // `ctx.mapLib.X` inside a tracking scope made it proxy the module and redefine each of its
  // accessor properties on the module object itself — throwing "Cannot redefine property:
  // version" in production builds where `version` is non-configurable, and mutating the user's
  // module even where it didn't throw. It never changes after mount, so it needs no reactivity:
  // it's an own, plain data property on an object whose prototype is the store, so every other
  // field (`map`, `constants`, `themeVersion`, ...) still resolves through the reactive store.
  const ctx: MapContextState = Object.create(state, {
    mapLib: { value: props.mapLib || null, enumerable: true },
  })

  return (
    <MapContext.Provider value={[ctx]}>{props.children}</MapContext.Provider>
  )
}
