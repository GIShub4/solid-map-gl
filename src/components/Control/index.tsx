import { onMount, onCleanup, createSignal, Component, lazy } from 'solid-js'
import { useMap } from '../MapGL'
import mapboxgl from 'mapbox-gl'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type { Options as AttributionOptions } from 'mapbox-gl/src/ui/control/attribution_control'
import type { Options as FullscreenOptions } from 'mapbox-gl/src/ui/control/fullscreen_control'
import type { Options as GeolocateOptions } from 'mapbox-gl/src/ui/control/geolocate_control'
import type { Options as NavigationOptions } from 'mapbox-gl/src/ui/control/navigation_control'
import type { Options as ScaleOptions } from 'mapbox-gl/src/ui/control/scale_control'

const Control: Component<{
  type:
    | 'navigation'
    | 'scale'
    | 'attribution'
    | 'fullscreen'
    | 'geolocate'
    | 'language'
    | 'traffic'
  options?:
    | NavigationOptions
    | ScaleOptions
    | AttributionOptions
    | FullscreenOptions
    | GeolocateOptions
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}> = props => {
  const map: MapboxMap = useMap()
  const [control, setControl] = createSignal(null)
  // Add Control
  onMount(async () => {
    let control

    switch (props.type) {
      case 'navigation':
        control = new mapboxgl.NavigationControl(props.options)
        break
      case 'scale':
        control = new mapboxgl.ScaleControl(props.options)
        break
      case 'attribution':
        control = new mapboxgl.AttributionControl(props.options)
        break
      case 'fullscreen':
        control = new mapboxgl.FullscreenControl(props.options)
        break
      case 'geolocate':
        control = new mapboxgl.GeolocateControl(props.options)
        break
      // case 'language':
      //   // @ts-ignore
      //   const MapboxLanguage = (await import('@mapbox/mapbox-gl-language'))
      //     .default
      //   control = new MapboxLanguage(props.options)
      //   break
      // case 'traffic':
      //   // @ts-ignore
      //   const MapboxTraffic = (await import('@mapbox/mapbox-gl-traffic'))
      //     .default
      //   // @ts-ignore
      //   await import('@mapbox/mapbox-gl-traffic/mapbox-gl-traffic.css')
      //   control = new MapboxTraffic(props.options)
      //   break
    }
    control && map().addControl(control, props.position)
    setControl(control)
  })

  onCleanup(() => map().removeControl(control()))

  return props.children
}

export default Control
