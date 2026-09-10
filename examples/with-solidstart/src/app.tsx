import { clientOnly } from "@solidjs/start";
import "./app.css";

// mapbox-gl/maplibre-gl need a real WebGL context, so there's nothing meaningful for MapGL to
// produce server-side beyond an empty container div (see this repo's SSR notes in
// src/components/MapGL/index.ssr.test.tsx) — clientOnly skips server rendering for MapDemo
// entirely and mounts it purely client-side instead, the same pattern examples/with-astro uses
// via Astro's `client:only="solid"`.
const MapDemo = clientOnly(() => import("./components/MapDemo"));

export default function App() {
  return <MapDemo fallback={<p>Loading map...</p>} />;
}
