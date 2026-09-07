import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  // https://gis-hub.gitbook.io/solid-map-gl/docs/start.md — mapbox-gl ships a
  // CJS/ESM-interop-unfriendly build that Vite's dep pre-bundler needs a hint for.
  optimizeDeps: { include: ["mapbox-gl"] },
});
