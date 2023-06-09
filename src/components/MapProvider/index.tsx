import { createContext, useContext, ParentComponent, createSignal } from "solid-js";
import type { Map } from '../MapGL'

const [map, setMap] = createSignal(null)
const [userInteraction, setUserInteraction] = createSignal(null)

export const MapContext = createContext([map, userInteraction])

export const useMap = () => useContext(MapContext)

export const MapProvider: ParentComponent<{
    map?: Map,
    userInteraction?: boolean;
}> = props => {
    props.map && setMap(props.map)
    props.userInteraction && setUserInteraction(props.userInteraction)

    return (
        <MapContext.Provider value={[map, userInteraction]}>
            {props.children}
        </MapContext.Provider>
    )
}