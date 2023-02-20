import type {
  MapMouseEvent,
  MapTouchEvent,
  MapWheelEvent,
  MapDataEvent,
  MapBoxZoomEvent,
} from 'mapbox-gl/src/ui/events'

type mapEventTypes = {
  onMouseDown?: (event: MapMouseEvent) => void
  onMouseUp?: (event: MapMouseEvent) => void
  onMouseOver?: (event: MapMouseEvent) => void
  onMouseOut?: (event: MapMouseEvent) => void
  onMouseMove?: (event: MapMouseEvent) => void
  onMouseEnter?: (event: MapMouseEvent) => void
  onMouseLeave?: (event: MapMouseEvent) => void
  onPreClick?: (event: MapMouseEvent) => void
  onClick?: (event: MapMouseEvent) => void
  onDblClick?: (event: MapMouseEvent) => void
  onContextMenu?: (event: MapMouseEvent) => void
  onTouchStart?: (event: MapTouchEvent) => void
  onTouchEnd?: (event: MapTouchEvent) => void
  onTouchCancel?: (event: MapTouchEvent) => void
  onTouchMove?: (event: MapTouchEvent) => void
  onWheel?: (event: MapWheelEvent) => void
  onResize?: () => void
  onRemove?: () => void
  onMoveStart?: (event: DragEvent) => void
  onMove?: (event: MapMouseEvent | MapTouchEvent) => void
  onMoveEnd?: (event: DragEvent) => void
  onDragStart?: (event: DragEvent) => void
  onDrag?: (event: MapMouseEvent | MapTouchEvent) => void
  onDragEnd?: (event: DragEvent) => void
  onZoomStart?: (event: MapMouseEvent | MapTouchEvent) => void
  onZoom?: (event: MapMouseEvent | MapTouchEvent) => void
  onZoomEnd?: (event: MapMouseEvent | MapTouchEvent) => void
  onRotateStart?: (event: MapMouseEvent | MapTouchEvent) => void
  onRotate?: (event: MapMouseEvent | MapTouchEvent) => void
  onRotatEnd?: (event: MapMouseEvent | MapTouchEvent) => void
  onPitchStart?: (event: MapDataEvent) => void
  onPitch?: (event: MapDataEvent) => void
  onPitchEnd?: (event: MapDataEvent) => void
  onBoxZoomStart?: (event: MapBoxZoomEvent) => void
  onBoxZoomEnd?: (event: MapBoxZoomEvent) => void
  onBoxZoomCancel?: (event: MapBoxZoomEvent) => void
  onWebglContextLost?: () => void
  onWebglContextRestored?: () => void
  onLoad?: (event: any) => void
  onRender?: () => void
  onIdle?: () => void
  onError?: (error: string) => void
  onData?: (event: MapDataEvent) => void
  onStyleData?: (event: MapDataEvent) => void
  onSourceData?: (event: MapDataEvent) => void
  onDataLoading?: (event: MapDataEvent) => void
  onStyleDataLoading?: (event: MapDataEvent) => void
  onSourceDataLoading?: (event: MapDataEvent) => void
  onStyleImageMissing?: (event: MapDataEvent) => void
}

const mapEvents: string[] = [
  'onMouseDown',
  'onMouseUp',
  'onMouseOver',
  'onMouseOut',
  'onMouseMove',
  'onMouseEnter',
  'onMouseLeave',
  'onPreClick',
  'onClick',
  'onDblClick',
  'onContextMenu',
  'onTouchStart',
  'onTouchEnd',
  'onTouchCancel',
  'onWheel',
  'onResize',
  'onRemove',
  'onTouchMove',
  'onMoveStart',
  'onMove',
  'onMoveEnd',
  'onDragStart',
  'onDrag',
  'onDragEnd',
  'onZoomStart',
  'onZoom',
  'onZoomEnd',
  'onRotateStart',
  'onRotate',
  'onRotatEnd',
  'onPitchStart',
  'onPitch',
  'onPitchEnd',
  'onBoxZoomStart',
  'onBoxZoomEnd',
  'onBoxZoomCancel',
  'onWebglContextLost',
  'onWebglContextRestored',
  'onLoad',
  'onRender',
  'onIdle',
  'onError',
  'onData',
  'onStyleData',
  'onSourceData',
  'onDataLoading',
  'onStyleDataLoading',
  'onSourceDataLoading',
  'onStyleImageMissing',
]

type layerEventTypes = {
  onMouseDown?: (event: MapMouseEvent) => void
  /** called when the mouse button is pressed down on the layer */
  onMouseUp?: (event: MapMouseEvent) => void
  /** called when the mouse button is released after a mouse down event on the layer */
  onMouseOver?: (event: MapMouseEvent) => void
  /** called when the mouse enters the layer */
  onMouseOut?: (event: MapMouseEvent) => void
  /** called when the mouse leaves the layer */
  onMouseMove?: (event: MapMouseEvent) => void
  /** called when the mouse is moved over the layer */
  onMouseEnter?: (event: MapMouseEvent) => void
  /** called when the mouse enters the layer */
  onMouseLeave?: (event: MapMouseEvent) => void
  /** called when the mouse leaves the layer */
  onClick?: (event: MapMouseEvent) => void
  /** called when the layer is clicked */
  onDblClick?: (event: MapMouseEvent) => void
  /** called when the layer is double-clicked */
  onContextMenu?: (event: MapMouseEvent) => void
  /** called when the context menu is triggered on the layer */
  onTouchStart?: (event: MapTouchEvent) => void
  /** called when a touch event is started on the layer */
  onTouchEnd?: (event: MapTouchEvent) => void
  /** called when a touch event is ended on the layer */
  onTouchCancel?: (event: MapTouchEvent) => void
  /** called when a touch event is cancelled on the layer */
}

const layerEvents: any[] = [
  'onMouseDown',
  'onMouseUp',
  'onMouseOver',
  'onMouseOut',
  'onMouseMove',
  'onMouseEnter',
  'onMouseLeave',
  'onClick',
  'onDblClick',
  'onContextMenu',
  'onTouchStart',
  'onTouchEnd',
  'onTouchCancel',
]

export { mapEvents, layerEvents }
export type { mapEventTypes, layerEventTypes }
