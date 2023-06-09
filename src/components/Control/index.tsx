import { createEffect, onCleanup, VoidComponent } from 'solid-js'
import { useMap } from '../MapProvider'
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

type Props = {
  type?: 'navigation' | 'scale' | 'attribution' | 'fullscreen' | 'geolocate'
  /** a string that specifies the type of control to be displayed. It can be one of 'navigation', 'scale', 'attribution', 'fullscreen', or 'geolocate' */
  options?:
  | NavigationOptions
  | ScaleOptions
  | AttributionOptions
  | FullscreenOptions
  | GeolocateOptions
  | object
  /** an optional object that contains options specific to the control type */
  custom?: any
  /**  an optional field that allows passing a custom control element. */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** a string that specifies the position of the control on the map. It can be one of 'top-left', 'top-right', 'bottom-left', or 'bottom-right' */
}

export const Control: VoidComponent<Props> = props => {
  const [map] = useMap()
  let control = null

  // Add or Update Control
  createEffect(() => {
    control && map().hasControl(control) && map().removeControl(control)
    control = getControl(map().mapLib, props.type, props.options, props.custom)
    map().addControl(control, props.position)
  })

  // Remove Control
  onCleanup(() => map()?.removeControl(control))

  return null
}
