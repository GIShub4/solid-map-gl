/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solidPlugin()],

  test: {
    environment: "jsdom",
    globals: true,
    deps: {
      registerNodeLoader: true,
    },
    setupFiles: "./src/vitest.ts",
    coverage: {
      all: true,
      include: ["src/"],
      reporter: ["text", "html-spa"],
    },
  },

  resolve: {
    conditions: ['development', 'browser'],
  },
  
  optimizeDeps: {
    include: ['mapbox-gl'],
  },
})
