import { onMount, onCleanup, createSignal, Component } from 'solid-js'
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

  const getControl = (type, options) => {
    switch (type) {
      case 'navigation':
        return new mapboxgl.NavigationControl(options)
      case 'scale':
        return new mapboxgl.ScaleControl(options)
      case 'attribution':
        return new mapboxgl.AttributionControl(options)
      case 'fullscreen':
        return new mapboxgl.FullscreenControl(
          options || { container: map().container }
        )
      case 'geolocate':
        return new mapboxgl.GeolocateControl(options)
      // case 'language':
      //   try {
      //     const MapboxLanguage = require('@mapbox/mapbox-gl-language').default
      //     return new MapboxLanguage(options)
      //   } catch (e) {}
      // case 'traffic':
      //   try {
      //     const MapboxTraffic = require('@mapbox/mapbox-gl-traffic').default
      //     require('@mapbox/mapbox-gl-traffic/mapbox-gl-traffic.css')
      //     return new MapboxTraffic(options)
      //   } catch (e) {}
    }
  }

  // Add Control
  onMount(() => {
    const control = getControl(props.type, props.options)
    control && map().addControl(control, props.position)
    setControl(control)
  })

  onCleanup(() => map().removeControl(control()))

  return props.children
}

export default Control
