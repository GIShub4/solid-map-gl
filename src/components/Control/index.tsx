import { createEffect, VoidComponent } from 'solid-js'
import { useMapContext } from '../MapProvider'
import type { Options as AttributionOptions } from 'mapbox-gl/src/ui/control/attribution_control'
import type { Options as FullscreenOptions } from 'mapbox-gl/src/ui/control/fullscreen_control'
import type { Options as GeolocateOptions } from 'mapbox-gl/src/ui/control/geolocate_control'
import type { Options as NavigationOptions } from 'mapbox-gl/src/ui/control/navigation_control'
import type { Options as ScaleOptions } from 'mapbox-gl/src/ui/control/scale_control'

type ControlType =
  | 'navigation'
  | 'scale'
  | 'attribution'
  | 'fullscreen'
  | 'geolocate'

type Props = {
  type?: ControlType
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

export const Control: VoidComponent<Props> = (props) => {
  const [ctx] = useMapContext()
  const controlClasses = new Map<ControlType, any>([
    ['navigation', ctx.map.mapLib.NavigationControl],
    ['scale', ctx.map.mapLib.ScaleControl],
    ['attribution', ctx.map.mapLib.AttributionControl],
    ['geolocate', ctx.map.mapLib.GeolocateControl],
    ['fullscreen', ctx.map.mapLib.FullscreenControl],
  ])

  // Add or Update Control
  createEffect(() => {
    const control = props.custom || new (controlClasses.get(props.type || 'navigation'))(props.options)
    control && ctx.map.hasControl(control) && ctx.map.removeControl(control)
    ctx.map.addControl(control, props.position)
  })

  return null
}
