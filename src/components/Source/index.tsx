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

  const lookup = url =>
    rasterStyleList[url]
      ? {
          ...props.source,
          url: '',
          tiles: [
            rasterStyleList[url][0].replace('{apikey}', props.source.apikey),
          ],
          attribution: rasterStyleList[url][1],
        }
      : props.source

  // Add Source
  createEffect(() => {
    const source = lookup(props.source.url)
    source.tiles &&
      (source.tiles = ['a', 'b', 'c'].map(i =>
        source.tiles[0].replace('{s}', i)
      ))
    !map().getSource(props.id) && map().addSource(props.id, source)
  })

  // Remove Source
  onCleanup(() => {
    map()
      .getStyle()
      .layers.forEach(
        layer => layer.source === props.id && map().removeLayer(layer.id)
      )
    map().getSource(props.id) && map().removeSource(props.id)
  })

  // Update
  createEffect(() => {
    const source = map().getSource(props.id)
    if (!source) return

    // Update GeoJSON Data
    if (props.source.type === 'geojson' && props.source.data)
      source.setData(props.source.data)

    // Update Image URL
    if (
      props.source.type === 'image' &&
      (props.source.url || props.source.coordinates)
    )
      source.updateImage(props.source.url, props.source.coordinates)

    // Update Vector URL or Tiles
    if (
      props.source.type === 'vector' &&
      (props.source.url || props.source.tiles)
    )
      props.source.url
        ? source.setUrl(props.source.url)
        : source.setTiles(props.source.tiles)

    // Update Raster URL or Tiles
    if (
      props.source.type === 'raster' &&
      (props.source.url || props.source.tiles)
    ) {
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
