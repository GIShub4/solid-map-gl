import { createEffect, Component } from 'solid-js'
import { useMap } from '../MapGL'
import type LngLatLike from 'mapbox-gl/src/geo/lng_lat.js'

// linearly interpolate between two positions [x,y,z] based on time
const lerp = (a, b, t) => a.map((_, idx) => (1.0 - t) * a[idx] + t * b[idx])

// sphericaly interpolate between two positions [x,y,z] based on time
const slerp = (a, b, t) => {
  const dotProduct = a.map((_, idx) => a[idx] * b[idx]).reduce((m, n) => m + n)
  const theta = Math.acos(dotProduct)

  return a.map(
    (_, idx) =>
      (Math.sin((1 - t) * theta) / Math.sin(theta)) * a[idx] +
      (Math.sin(t * theta) / Math.sin(theta)) * b[idx]
  )
}

// const slerp = (a, b, t) => {
//   const omega = 0.075
//   // TODO: Proper Calculation
//   // a.map((_, idx) => a[idx] * b[idx]).reduce((m, n) => m + n)

//   return a.map(
//     (_, idx) =>
//       (Math.sin((1 - t) * omega) / Math.sin(omega)) * a[idx] +
//       (Math.sin(t * omega) / Math.sin(omega)) * b[idx]
//   )
// }

// calculations from: https://easings.net
const easeQuad = {
  in: (x: number): number => x * x,
  out: (x: number): number => 1 - (1 - x) * (1 - x),
  inOut: (x: number): number =>
    x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,
}

interface RotateOptions {
  secPerRev?: number
  maxZoom?: number
  slowZoom?: number
  pitch?: number
  around?: LngLatLike
}

type Props = {
  rotateGlobe?: boolean | RotateOptions
  rotateViewport?: boolean | RotateOptions
  reverse: boolean
  resetWhenStopped?: boolean
  translate?: {
    type?: 'line' | 'sphere'
    start: [number, number, number]
    end: [number, number, number]
    target: LngLatLike
    targetEnd?: LngLatLike
    easing?: 'in' | 'out' | 'inOut'
    loop?: boolean
    duration: number
  }
  children?: any
}

export const Camera: Component<Props> = props => {
  if (!useMap()) return
  const [map, userInteraction] = useMap()
  let animationTime = 0.1
  let isReverse = false

  const updateCameraPosition = async ([lng, lat, alt], target) => {
    const camera = map().getFreeCameraOptions()
    camera.position = map().mapLib.MercatorCoordinate.fromLngLat(
      [lng, lat],
      alt
    )
    camera.lookAtPoint(target)
    map().setFreeCameraOptions(camera)
  }

  const frame = (time: number) => {
    props.translate && window.requestAnimationFrame(frame)
    const params = [
      props.translate.start,
      props.translate.end,
      props.translate.easing
        ? easeQuad[props.translate.easing](animationTime)
        : animationTime,
    ] as const
    const position =
      props.translate.type === 'line' ? lerp(...params) : slerp(...params)

    updateCameraPosition(position, props.translate.target)

    if (!props.translate.loop && (animationTime > 1.0 || animationTime < 0.0))
      isReverse = !isReverse
    animationTime = isReverse ? animationTime - 0.001 : animationTime + 0.001
  }

  createEffect(() => {
    props.translate && window.requestAnimationFrame(frame)
  })

  const rotateGlobe = () => {
    const secPerRev = (props.rotateGlobe as RotateOptions).secPerRev || 120
    const maxSpinZoom = (props.rotateGlobe as RotateOptions).maxZoom || 5
    const slowSpinZoom = (props.rotateGlobe as RotateOptions).slowZoom || 3
    const zoom = map().getZoom()
    if (!props.rotateGlobe || userInteraction() || zoom > maxSpinZoom) return

    let distancePerSecond = 360 / secPerRev
    if (zoom > slowSpinZoom)
      distancePerSecond *= (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom)
    const center = map().getCenter()
    center.lng = props.reverse
      ? center.lng + distancePerSecond
      : center.lng - distancePerSecond
    map().easeTo({ center, duration: 1000, easing: n => n }, { rotate: true })
  }

  const rotateViewport = () => {
    if (!props.rotateViewport || userInteraction()) return
    const secPerRev = (props.rotateViewport as RotateOptions)?.secPerRev || 60
    const bearing = props.reverse
      ? map().getBearing() + 360 / secPerRev
      : map().getBearing() - 360 / secPerRev
    map().easeTo(
      {
        bearing,
        pitch: (props.rotateViewport as RotateOptions)?.pitch || 60,
        duration: 1000,
        around: (props.rotateViewport as RotateOptions)?.around,
        easing: n => n,
      },
      { rotate: true }
    )
  }

  map().on('moveend', evt => {
    evt.rotate && props.rotateGlobe ? rotateGlobe() : rotateViewport()
  })
  map().on('dragend', evt =>
    props.rotateGlobe ? rotateGlobe() : rotateViewport()
  )

  let originalCenter
  createEffect(() => {
    if (props.rotateGlobe == undefined) return
    if (props.rotateGlobe) {
      originalCenter = map().getCenter()
      rotateGlobe()
    } else {
      map().stop().easeTo({ center: originalCenter })
    }
  })

  createEffect(() => {
    if (props.rotateViewport == undefined) return
    props.rotateViewport
      ? rotateViewport()
      : props.resetWhenStopped
      ? map().stop().resetNorthPitch()
      : map().stop()
  })

  return props.children
}
