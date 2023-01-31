import { cleanup } from 'solid-testing-library'
import { afterEach, afterAll, vi } from 'vitest'

global.jest = vi

// import getCanvasWindow from 'jest-canvas-mock/lib/window'

// const apis = [
//   'Path2D',
//   'CanvasGradient',
//   'CanvasPattern',
//   'CanvasRenderingContext2D',
//   'DOMMatrix',
//   'ImageData',
//   'TextMetrics',
//   'ImageBitmap',
//   'createImageBitmap',
// ] as const

// apis.forEach(api => {
//   // @ts-expect-error: Global type missing
//   global[api] = canvasWindow[api]
//   // @ts-expect-error: Global type missing
//   global.window[api] = canvasWindow[api]
// })

afterAll(() => {
  delete global.jest
  // @ts-expect-error: type
  delete global.window.jest
})

afterEach(cleanup)
