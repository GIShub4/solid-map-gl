import { createContext, useContext, ParentComponent } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { Map } from '../MapGL'

type MapContextState = {
  map: Map | null
  /** The resolved Mapbox/MapLibre module in use — replaces the old `window.MapLib` global */
  mapLib: any
  isMapLibre: boolean
}

const defaultState: MapContextState = { map: null, mapLib: null, isMapLibre: false }

export const MapContext = createContext<[MapContextState]>([defaultState])

export const useMapContext = () => useContext(MapContext)

export const MapProvider: ParentComponent<{
  map?: Map
  mapLib?: any
  isMapLibre?: boolean
}> = (props) => {
  // Store is created per-instance (not module-scoped) so multiple <MapGL>s, even mixing
  // Mapbox/MapLibre, each get their own isolated context value instead of overwriting one global.
  const [state, setState] = createStore<MapContextState>({ ...defaultState })

  props.map && setState('map', props.map)
  props.mapLib && setState('mapLib', props.mapLib)
  setState('isMapLibre', !!props.isMapLibre)

  return (
    <MapContext.Provider value={[state]}>{props.children}</MapContext.Provider>
  )
}
