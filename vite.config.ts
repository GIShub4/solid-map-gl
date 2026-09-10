/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  test: {
    coverage: {
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text", "html-spa", "lcov"],
    },

    // Two projects because SSR needs the opposite of everything the jsdom project is set up for:
    // solid-js's real "node" export condition (isServer === true, no DOM at all) instead of the
    // 'browser' condition forced below, and vite-plugin-solid's `ssr: true` option (JSX compiled
    // to solid-js/web's ssr() helpers instead of DOM calls) instead of its default DOM codegen.
    projects: [
      {
        plugins: [solidPlugin()],
        test: {
          name: "unit",
          environment: "jsdom",
          globals: true,
          deps: {
            registerNodeLoader: true,
          },
          setupFiles: "./src/vitest.ts",
          exclude: ["**/node_modules/**", "src/**/*.ssr.test.tsx"],
        },
        resolve: {
          conditions: ["development", "browser"],
        },
        optimizeDeps: {
          include: ["mapbox-gl"],
        },
      },
      {
        plugins: [solidPlugin({ ssr: true })],
        test: {
          name: "ssr",
          environment: "node",
          globals: true,
          include: ["src/**/*.ssr.test.tsx"],
        },
      },
    ],
  },
})
