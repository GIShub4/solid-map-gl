import {
  onCleanup,
  createEffect,
  Component,
  createContext,
  useContext,
  createUniqueId,
} from 'solid-js'
import { useMap } from '../MapGL'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type { SourceSpecification } from 'mapbox-gl/src/style-spec/types.js'
import { rasterStyleList } from '../../mapStyles'

const SourceContext = createContext<string>()
export const useSourceId = (): string => useContext(SourceContext)

export const Source: Component<{
  /** @optional Source ID for referencing non nexted Layers */
  id?: string
  /** @see https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/ */
  source: SourceSpecification
  children?: any
}> = props => {
  const map: MapboxMap = useMap()
  props.id = props.id || createUniqueId()

  const lookup = url => {
    const s = url?.split(':').reduce((p, c) => p && p[c], rasterStyleList)
    const source = s
      ? {
          ...props.source,
          url: '',
          tiles: [
            s
              .replace(
                '{apikey}', //@ts-ignore
                props.source.apikey || import.meta.env.VITE_RASTER_API_KEY
              )
              .replace('{r}', window.devicePixelRatio > 1 ? '@2x' : ''),
          ],
          attribution: rasterStyleList[url.split(':')[0]]._copy,
        }
      : props.source

    source.tiles &&
      (source.tiles = ['a', 'b', 'c'].map(i =>
        source.tiles[0].replace('{s}', i)
      ))

    return source
  }

  // Remove Source
  onCleanup(() => {
    map &&
      map()
        .getStyle()
        .layers.forEach(
          layer => layer.source === props.id && map().removeLayer(layer.id)
        )
    map().removeSource(props.id)
  })

  // Update
  createEffect(() => {
    // Add Source
    if (!map().getSource(props.id)) {
      map().addSource(props.id, lookup(props.source.url))
      return
    }

    // Update GeoJSON Data
    if (props.source.type === 'geojson' && props.source.data)
      map().getSource(props.id)?.setData(props.source.data)

    // Update Image URL
    if (
      props.source.type === 'image' &&
      (props.source.url || props.source.coordinates)
    )
      map()
        .getSource(props.id)
        ?.updateImage(props.source.url, props.source.coordinates)

    // Update Vector URL or Tiles
    if (
      props.source.type === 'vector' &&
      (props.source.url || props.source.tiles)
    )
      props.source.url
        ? map().getSource(props.id)?.setUrl(props.source.url)
        : map().getSource(props.id)?.setTiles(props.source.tiles)

    // Update Raster URL or Tiles
    if (
      props.source.type === 'raster' &&
      (props.source.url || props.source.tiles)
    ) {
      let source = map().getSource(props.id)
      if (!source) return
      const src = lookup(props.source.url)
      src.tiles &&
        (src.tiles = ['a', 'b', 'c'].map(i => src.tiles[0].replace('{s}', i)))
      source._tileJSONRequest?.cancel()
      source.url = src.url
      source.scheme = src.scheme
      source._options = { ...source._options, ...src }
      map().style._sourceCaches[`other:${props.id}`]?.clearTiles()
      source.load()
    }
  })

  return (
    <SourceContext.Provider value={props.id}>
      {props.children}
    </SourceContext.Provider>
  )
}
