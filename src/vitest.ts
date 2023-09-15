import '@testing-library/jest-dom'
import 'jsdom-worker'

// @ts-ignore
window.matchMedia =
  window.matchMedia ||
  (() => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
  }))
