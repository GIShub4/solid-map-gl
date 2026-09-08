import '@testing-library/jest-dom'
import 'jsdom-worker'

// jsdom doesn't implement ResizeObserver/MutationObserver-adjacent size-watching APIs; MapGL
// unconditionally constructs one once the map loads (unless disableResize), so every test that
// lets `load` fire needs this stubbed or it throws asynchronously, outside any test's own
// try/catch, as an unhandled rejection.
// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

// jsdom doesn't implement the Canvas Path2D API; only Image's pattern renderer
// (components/Image) and its canvas-fallback image loader construct one.
// @ts-ignore
window.Path2D = window.Path2D || class Path2D {
  constructor(_path?: string) {}
}

// @ts-ignore
window.matchMedia =
  window.matchMedia ||
  (() => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    // MapGL listens for dark-mode changes via the modern EventTarget-style API, not just the
    // deprecated addListener/removeListener pair — both need stubbing or it throws.
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
