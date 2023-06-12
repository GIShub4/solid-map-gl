import {
  onCleanup,
  createEffect,
  Component,
  createContext,
  useContext,
  createUniqueId,
} from 'solid-js'
import { useMapContext } from '../MapProvider'
import type { SourceSpecification } from 'mapbox-gl/src/style-spec/types.js'
import { rasterStyleList } from '../../mapStyles'

const SourceContext = createContext<string>()
export const useSourceId = (): string => useContext(SourceContext)

type Props = {
  /** @optional Source ID for referencing non nexted Layers */
  id?: string
  /** @see https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/ */
  source: SourceSpecification
  /** The map layers associated with this source */
  children?: any
}

export const Source: Component<Props> = props => {
  const [ctx] = useMapContext()
  props.id ??= createUniqueId()

  const debug = (text, value?) => {
    ctx.map.debug &&
      console.debug('%c[MapGL]', 'color: #ec4899', text, value || '')
  }

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

  // Add Source
  ctx.map.addSource(props.id, lookup(props.source.url))
  ctx.map.sourceIdList.push(props.id)
  debug('Add Source:', props.id)

  // Update Data
  const source = ctx.map.getSource(props.id)
  switch (props.source.type) {
    case 'geojson':
      createEffect(() => {
        const data = props.source.data
        if (!ctx.map.isSourceLoaded(props.id)) return
        source.setData(data || {})
        debug('Update GeoJSON Data:', props.id)
      })
      break
    case 'image':
      createEffect(() => {
        const url = props.source.url
        const coords = props.source.coordinates
        if (!ctx.map.isSourceLoaded(props.id)) return
        source.updateImage(url, coords)
        debug('Update Image Data:', props.id)
      })
      break
    case 'vector':
      createEffect(() => {
        const url = props.source.url
        const tiles = props.source.tiles
        if (!ctx.map.isSourceLoaded(props.id)) return
        url ? source.setUrl(url) : source.setTiles(tiles)
        debug('Update Vector Data:', props.id)
      })
      break
    case 'raster':
      createEffect(() => {
        const src = lookup(props.source.url)
        if (!ctx.map.isSourceLoaded(props.id)) return
        src.url ? source.setUrl(src.url) : source.setTiles(src.tiles)
        debug('Update Raster Data:', props.id)
      })
      break
  }

  // Remove Source
  onCleanup(() => {
    ctx.map
      ?.getStyle()
      .layers.forEach(
        layer => layer.source === props.id && ctx.map.removeLayer(layer.id)
      )
    ctx.map?.getSource(props.id) && ctx.map?.removeSource(props.id)
    debug('Remove Source:', props.id)
  })

  return (
    <SourceContext.Provider value={props.id}>
      {props.children}
    </SourceContext.Provider>
  )
}
