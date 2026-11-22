import {
  onCleanup,
  createEffect,
  Component,
  createContext,
  useContext,
  createUniqueId,
} from 'solid-js'
import { useMapContext } from '../MapProvider'
import type { SourceSpecification } from 'mapbox-gl'
import { rasterStyleList } from '../../lib/mapStyles'

const SourceContext = createContext<string>()
const NOT_SENT = Symbol()
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

  // Loosely typed on purpose: the source spec's fields genuinely differ per `type`, and this
  // component dispatches on `type` at runtime rather than statically narrowing the union.
  const anySource = () => props.source as any

  const lookup = url => {
    const s = url?.split(':').reduce((p, c) => p && p[c], rasterStyleList)
    const source: any = s
      ? {
        ...anySource(),
        url: '',
        tiles: [
          s
            .replace(
              '{apikey}', //@ts-expect-error -- import.meta.env is Vite-only
              anySource().apikey || import.meta.env?.VITE_RASTER_API_KEY
            )
            .replace('{r}', window.devicePixelRatio > 1 ? '@2x' : ''),
        ],
        attribution: rasterStyleList[url.split(':')[0]]._copy,
      }
      : anySource()

    source.tiles &&
      (source.tiles = ['a', 'b', 'c'].map(i =>
        source.tiles[0].replace('{s}', i)
      ))

    return source
  }

  // Add Source
  ctx.map.addSource(props.id, lookup(anySource().url))
  ctx.map.sourceIdList.push(props.id)
  debug('Add Source:', props.id)

  // Update Data
  //
  // Each branch re-reads `ctx.map.getSource(props.id)` rather than closing over the source added
  // above, because a base style swap (MapGL's "Update map style" effect) tears down and
  // asynchronously rebuilds every source, including this one — a source present at add time may
  // already be gone by the time this effect (re-)runs. All four `getSource(...)` calls below can
  // therefore transiently return undefined for an already-mounted <Source> whose effect fires
  // while that swap's restore (a second, later `setStyle()` once "styledata" fires) hasn't landed
  // yet. Skipping the update in that window is safe: the restore re-adds the source using the same
  // `props.source` this effect would otherwise have applied.
  switch (anySource().type) {
    case 'geojson':
      // Seeded with the data addSource() above was just given, so the effect's first run is a
      // no-op instead of an immediate setData() of the same data. That redundant call made
      // Mapbox/MapLibre load and tile the source twice back to back, and a clustered source
      // could then render tiles from both loads at once — a cluster circle plus the single
      // point it contains drawn on top of it, differing between refreshes (#166). Missing data
      // still goes through setData({}) once on mount, as before.
      createEffect((prev: unknown) => {
        const data = anySource().data
        if (data === prev) return prev
        const source = ctx.map.getSource(props.id) as any
        if (!source) return data
        source.setData(data || {})
        debug('Update GeoJSON Data:', props.id)
        return data
      }, anySource().data ?? NOT_SENT)
      break
    case 'image':
      createEffect(() => {
        const url = anySource().url
        const coords = anySource().coordinates
        const source = ctx.map.getSource(props.id) as any
        if (!source) return
        source.updateImage(url, coords)
        debug('Update Image Data:', props.id)
      })
      break
    case 'vector':
      createEffect(() => {
        const url = anySource().url
        const tiles = anySource().tiles
        const source = ctx.map.getSource(props.id) as any
        if (!source) return
        url ? source.setUrl(url) : source.setTiles(tiles)
        debug('Update Vector Data:', props.id)
      })
      break
    case 'raster':
      createEffect(() => {
        const src = lookup(anySource().url)
        const source = ctx.map.getSource(props.id) as any
        if (!source) return
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
