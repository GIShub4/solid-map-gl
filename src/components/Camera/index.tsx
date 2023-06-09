import { createEffect, Component, onCleanup } from 'solid-js'
import { useMap } from '../MapProvider'
import type { LngLatLike } from 'mapbox-gl'

// linearly interpolate between two positions [x,y,z] based on time
const lerp = (a: number[], b: number[], t: number): number[] => a.map((_, idx) => (1.0 - t) * a[idx] + t * b[idx])

// sphericaly interpolate between two positions [x,y,z] based on time
const slerp = (a: number[], b: number[], t: number): number[] => {
  const dotProduct = a.map((_, idx) => a[idx] * b[idx]).reduce((m, n) => m + n)
  const theta = Math.acos(dotProduct)

  return a.map(
    (_, idx) =>
      (Math.sin((1 - t) * theta) / Math.sin(theta)) * a[idx] +
      (Math.sin(t * theta) / Math.sin(theta)) * b[idx]
  )
}

// calculations from: https://easings.net
const easeQuad = {
  in: (x: number): number => x * x,
  out: (x: number): number => 1 - (1 - x) * (1 - x),
  inOut: (x: number): number =>
    x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,
}

/** Options for rotating the globe. */
interface RotateGlobeOptions {
  /** The number of seconds per revolution. */
  secPerRev?: number
  /** The maximum zoom level for spinning the globe.  */
  maxSpinZoom?: number
  /** The zoom level at which the spinning slows down. */
  slowSpinZoom?: number
}

/** Options for rotating the viewport. */
interface RotateViewportOptions {
  /** The number of seconds per revolution. */
  secPerRev?: number
  /** The pitch angle in degrees. */
  pitch?: number
  /** The center of rotation. */
  around?: LngLatLike
}

/** Props for the component. */
type Props = {
  /** Whether to rotate the globe. */
  rotateGlobe?: boolean | RotateGlobeOptions
  /** Whether to rotate the viewport. */
  rotateViewport?: boolean | RotateViewportOptions
  /** Whether to reverse the rotation direction. */
  reverse?: boolean
  /** Whether to reset the rotation when stopped. */
  resetWhenStopped?: boolean
  /** Translation options. */
  translate?: {
    /** The type of translation. */
    type?: 'line' | 'sphere'
    /** The starting position. */
    start: [number, number, number]
    /** The ending position. */
    end: [number, number, number]
    /** The target position. */
    target: LngLatLike
    /** The ending target position. */
    targetEnd?: LngLatLike
    /** The easing function to use. */
    easing?: 'in' | 'out' | 'inOut'
    /** Whether to loop the translation. */
    loop?: boolean
    /** The duration of the translation in milliseconds. */
    duration: number
  }
  /** The children to render. */
  children?: any
}

export const Camera: Component<Props> = props => {
  const [map, userInteraction] = useMap()
  if (!map()) return null
  let animationTime = 0.1
  let isReverse = false

  const updateCameraPosition = async ([lng, lat, alt]: number[], target: LngLatLike) => {
    const camera = map().getFreeCameraOptions()
    camera.position = map().mapLib.MercatorCoordinate.fromLngLat([lng, lat], alt)
    camera.lookAtPoint(target)
    map().setFreeCameraOptions(camera)
  }

  const frame = () => {
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

  const options = { duration: 1000, easing: n => n }

  const rotateGlobe = (): void => {
    if (userInteraction) return
    const {
      secPerRev = 120,
      maxSpinZoom = 5,
      slowSpinZoom = 3,
    }: RotateGlobeOptions = props.rotateGlobe as RotateGlobeOptions

    const zoom: number = map().getZoom()
    if (zoom > maxSpinZoom) return
    let distancePerSecond: number = 360 / secPerRev
    if (zoom > slowSpinZoom)
      distancePerSecond *= (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom)
    const center: mapboxgl.LngLat = map().getCenter()
    center.lng = props.reverse
      ? center.lng + distancePerSecond
      : center.lng - distancePerSecond
    map().easeTo({ center, ...options }, { rotate: true })
  }

  const rotateViewport = (): void => {
    if (!props.rotateViewport || userInteraction) return
    const rotateViewport = props.rotateViewport as RotateViewportOptions
    const secPerRev = rotateViewport?.secPerRev || 60
    const bearing = props.reverse
      ? map().getBearing() + 360 / secPerRev
      : map().getBearing() - 360 / secPerRev
    const pitch = rotateViewport?.pitch || 60
    const around = rotateViewport?.around
    map().easeTo({ bearing, pitch, around, ...options }, { rotate: true })
  }

  const onEnd = () => (props.rotateGlobe ? rotateGlobe() : rotateViewport())
  map().on('moveend', onEnd).on('dragend', onEnd)

  let originalCenter: mapboxgl.LngLatLike
  createEffect(() => {
    if (props.rotateGlobe == undefined) return
    if (props.rotateGlobe) {
      originalCenter = map().getCenter()
      rotateGlobe()
    } else {
      props.resetWhenStopped
        ? map().stop().easeTo({ center: originalCenter })
        : map().stop()
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

  onCleanup(() => map().off('moveend', onEnd).off('dragend', onEnd))

  return props.children
}
