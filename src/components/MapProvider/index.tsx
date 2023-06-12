import { createContext, useContext, ParentComponent } from "solid-js";
import { createStore } from "solid-js/store";
import type { Map } from '../MapGL'

const [state, setState] = createStore({
    map: null,
    userInteraction: false
})

export const MapContext = createContext([state])

export const useMapContext = () => useContext(MapContext)

export const MapProvider: ParentComponent<{
    map?: Map,
    userInteraction?: boolean;
}> = props => {
    props.map && setState('map', props.map)
    props.userInteraction && setState('userInteraction', props.userInteraction)

    return (
        <MapContext.Provider value={[state]}>
            {props.children}
        </MapContext.Provider>
    )
}