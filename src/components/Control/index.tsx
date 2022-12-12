import { createEffect, onCleanup, VoidComponent } from 'solid-js'
import { useMap } from '../MapGL'
import type { Options as AttributionOptions } from 'mapbox-gl/src/ui/control/attribution_control'
import type { Options as FullscreenOptions } from 'mapbox-gl/src/ui/control/fullscreen_control'
import type { Options as GeolocateOptions } from 'mapbox-gl/src/ui/control/geolocate_control'
import type { Options as NavigationOptions } from 'mapbox-gl/src/ui/control/navigation_control'
import type { Options as ScaleOptions } from 'mapbox-gl/src/ui/control/scale_control'

const getControl = (lib, type, options, custom?) => {
  if (custom) return new custom(options)
  switch (type) {
    case 'navigation':
      return new lib.NavigationControl(options)
    case 'scale':
      return new lib.ScaleControl(options)
    case 'attribution':
      return new lib.AttributionControl(options)
    case 'geolocate':
      return new lib.GeolocateControl(options)
    case 'fullscreen':
      return new lib.FullscreenControl()
    // options || { container: map().container }
    default:
      throw new Error(`Unknown control type: ${type}`)
  }
}

export const Control: VoidComponent<{
  type: 'navigation' | 'scale' | 'attribution' | 'fullscreen' | 'geolocate'
  options?:
    | NavigationOptions
    | ScaleOptions
    | AttributionOptions
    | FullscreenOptions
    | GeolocateOptions
    | object
  custom?: any
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  children?: any
}> = props => {
  if (!useMap()) return
  const [map] = useMap()
  const mapLib = map().mapLib
  let control = null

  // Add or Update Control
  createEffect(() => {
    control && map().hasControl(control) && map().removeControl(control)
    control = getControl(mapLib, props.type, props.options, props.custom)
    map().addControl(control, props.position)
  })

  // Remove Control
  onCleanup(() => map()?.removeControl(control))

  return null
}
