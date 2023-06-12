import { onCleanup, VoidComponent } from 'solid-js'
import { useMapContext } from '../MapProvider'
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
  getInstance?: (object) => void
} & drawEventTypes

export const Draw: VoidComponent<Props> = (props: Props) => {
  const [ctx] = useMapContext()

  // Add Draw Control
  const draw = new props.lib(props.options)
  ctx.map.addControl(draw, props.position || 'top-right')
  props.getInstance && props.getInstance(draw)

  // Hook up events
  const eventList: Record<string, (evt: any) => void> = {}
  drawEvents.forEach(item => {
    if (props[item]) {
      const event = `draw.${item.slice(2).toLowerCase()}`
      const fn = evt => props[item](evt)
      eventList[event] = fn
      ctx.map.on(event, fn)
    }
  })

  // Remove Draw Control
  onCleanup(() => {
    // Remove Events
    Object.keys(eventList).forEach(event => ctx.map.off(event, eventList[event]))
    // Remove Control
    ctx.map?.removeControl(draw)
  })

  return null
}
