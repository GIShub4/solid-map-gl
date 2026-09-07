import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Pass the MapLibre package via `mapLib` — every other component reads
// classes off `ctx.mapLib`/`ctx.isMapLibre` (computed once here) instead of
// importing mapbox-gl directly, so the exact same component tree works
// against either library. `mapbox-gl` is still a required peer dependency
// even in this MapLibre-only setup (see this example's package.json, which
// installs it as the `empty-npm-package` placeholder) — see docs/start.md.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.41, 37.78],
    zoom: 11,
  } as Viewport);

  return (
    <MapGL
      mapLib={maplibregl}
      options={{ style: "https://demotiles.maplibre.org/style.json" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    />
  );
};

render(() => <App />, document.getElementById("root")!);
