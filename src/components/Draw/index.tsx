import { onCleanup, VoidComponent } from 'solid-js'
import { useMap } from '../MapGL'
import { drawEvents } from '../../events'
import type { drawEventTypes } from '../../events'

type Props = {
  /** Draw Library */
  lib: any
  /** Draw Options */
  options?: object
  /** Draw Control Position */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Draw Control Instance */
  getInstance: (object) => void
} & drawEventTypes

export const Draw: VoidComponent<Props> = props => {
  if (!useMap()) return
  const [map] = useMap()

  // Add Draw Control
  const draw = new props.lib(props.options)
  //   console.log('a')
  map().addControl(draw, props.position || 'top-right')
  //   console.log('b')
  props.getInstance(draw)
  //   console.log('c')

  // Hook up events
  drawEvents.forEach(item => {
    if (props[item]) {
      const event = `draw.${item.slice(2).toLowerCase()}`
      map().on(event, evt => props[item](evt))
    }
  })

  // Remove Draw Control
  onCleanup(() => {
    map()?.removeControl(draw)
  })

  return null
}
