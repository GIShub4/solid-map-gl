import { defineConfig } from "astro/config";
import solidJs from "@astrojs/solid-js";

export default defineConfig({
  integrations: [solidJs()],
  site: "https://gishub4.github.io",
  base: "/solid-map-gl",
});
