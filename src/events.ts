type mapEventTypes = {
  onMouseDown?: () => void
  onMouseUp?: () => void
  onMouseOver?: () => void
  onMouseOut?: () => void
  onMouseMove?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onPreClick?: () => void
  onClick?: () => void
  onDblClick?: () => void
  onContextMenu?: () => void
  onTouchStart?: () => void
  onTouchEnd?: () => void
  onTouchCancel?: () => void
  onWheel?: () => void
  onResize?: () => void
  onRemove?: () => void
  onTouchMove?: () => void
  onMoveStart?: () => void
  onMove?: () => void
  onMoveEnd?: () => void
  onDragStart?: () => void
  onDrag?: () => void
  onDragEnd?: () => void
  onZoomStart?: () => void
  onZoom?: () => void
  onZoomEnd?: () => void
  onRotateStart?: () => void
  onRotate?: () => void
  onRotatEnd?: () => void
  onPitchStart?: () => void
  onPitch?: () => void
  onPitchEnd?: () => void
  onBoxZoomStart?: () => void
  onBoxZoomEnd?: () => void
  onBoxZoomCancel?: () => void
  onWebglContextLost?: () => void
  onWebglContextRestored?: () => void
  onLoad?: () => void
  onRender?: () => void
  onIdle?: () => void
  onError?: () => void
  onData?: () => void
  onStyleData?: () => void
  onSourceData?: () => void
  onDataLoading?: () => void
  onStyleDataLoading?: () => void
  onSourceDataLoading?: () => void
  onStyleImageMissing?: () => void
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
  onMouseDown?: () => void
  /** called when the mouse button is pressed down on the layer */
  onMouseUp?: () => void
  /** called when the mouse button is released after a mouse down event on the layer */
  onMouseOver?: () => void
  /** called when the mouse enters the layer */
  onMouseOut?: () => void
  /** called when the mouse leaves the layer */
  onMouseMove?: () => void
  /** called when the mouse is moved over the layer */
  onMouseEnter?: () => void
  /** called when the mouse enters the layer */
  onMouseLeave?: () => void
  /** called when the mouse leaves the layer */
  onClick?: () => void
  /** called when the layer is clicked */
  onDblClick?: () => void
  /** called when the layer is double-clicked */
  onContextMenu?: () => void
  /** called when the context menu is triggered on the layer */
  onTouchStart?: () => void
  /** called when a touch event is started on the layer */
  onTouchEnd?: () => void
  /** called when a touch event is ended on the layer */
  onTouchCancel?: () => void
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
