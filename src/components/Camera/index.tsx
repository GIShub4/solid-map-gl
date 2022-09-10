import { createEffect, Component } from 'solid-js'
import { useMap } from '../MapGL'
import type MapboxMap from 'mapbox-gl/src/ui/map'
import type LngLatLike from 'mapbox-gl/src/geo/lng_lat.js'
import mapboxgl from 'mapbox-gl'

// linearly interpolate between two positions [x,y,z] based on time
const lerp = (a, b, t) => a.map((_, idx) => (1.0 - t) * a[idx] + t * b[idx])

// sphericaly interpolate between two positions [x,y,z] based on time
const slerp = (a, b, t) => {
  const omega = 0.075
  // TODO: Proper Calculation
  // a.map((_, idx) => a[idx] * b[idx]).reduce((m, n) => m + n)

  return a.map(
    (_, idx) =>
      (Math.sin((1 - t) * omega) / Math.sin(omega)) * a[idx] +
      (Math.sin(t * omega) / Math.sin(omega)) * b[idx]
  )
}

// calculations from: https://easings.net
const easeQuad = {
  in: (x: number): number => x * x,
  out: (x: number): number => 1 - (1 - x) * (1 - x),
  inOut: (x: number): number =>
    x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,
}

export const Camera: Component<{
  animate: boolean
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
}> = props => {
  const map: MapboxMap = useMap()
  let animationTime = 0.1
  let isReverse = false

  const updateCameraPosition = ([lng, lat, alt], target) => {
    const camera = map().getFreeCameraOptions()
    camera.position = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], alt)
    camera.lookAtPoint(target)
    map().setFreeCameraOptions(camera)
  }

  const frame = (time: number) => {
    props.animate && window.requestAnimationFrame(frame)
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

  createEffect(async () => {
    props.animate && window.requestAnimationFrame(frame)
  })

  return props.children
}
