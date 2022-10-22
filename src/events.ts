type mapEventTypes = {
  onMouseDown?: Function
  onMouseUp?: Function
  onMouseOver?: Function
  onMouseOut?: Function
  onMouseMove?: Function
  onMouseEnter?: Function
  onMouseLeave?: Function
  onPreClick?: Function
  onClick?: Function
  onDblClick?: Function
  onContextMenu?: Function
  onTouchStart?: Function
  onTouchEnd?: Function
  onTouchCancel?: Function
  onWheel?: Function
  onResize?: Function
  onRemove?: Function
  onTouchMove?: Function
  onMoveStart?: Function
  onMove?: Function
  onMoveEnd?: Function
  onDragStart?: Function
  onDrag?: Function
  onDragEnd?: Function
  onZoomStart?: Function
  onZoom?: Function
  onZoomEnd?: Function
  onRotateStart?: Function
  onRotate?: Function
  onRotatEnd?: Function
  onPitchStart?: Function
  onPitch?: Function
  onPitchEnd?: Function
  onBoxZoomStart?: Function
  onBoxZoomEnd?: Function
  onBoxZoomCancel?: Function
  onWebglContextLost?: Function
  onWebglContextRestored?: Function
  onLoad?: Function
  onRender?: Function
  onIdle?: Function
  onError?: Function
  onData?: Function
  onStyleData?: Function
  onSourceData?: Function
  onDataLoading?: Function
  onStyleDataLoading?: Function
  onSourceDataLoading?: Function
  onStyleImageMissing?: Function
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
  onMouseDown?: Function
  onMouseUp?: Function
  onMouseOver?: Function
  onMouseOut?: Function
  onMouseMove?: Function
  onMouseEnter?: Function
  onMouseLeave?: Function
  onClick?: Function
  onDblClick?: Function
  onContextMenu?: Function
  onTouchStart?: Function
  onTouchEnd?: Function
  onTouchCancel?: Function
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
