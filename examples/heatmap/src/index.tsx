import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// A `heatmap` layer style is a flat prop object like any other — Layer's
// diffing (src/styles.ts) buckets `heatmap-*` paint properties correctly.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.41, 37.78],
    zoom: 10,
  } as Viewport);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:dark" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Source
        source={{
          type: "geojson",
          data: "https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson",
        }}
      >
        <Layer
          style={{
            type: "heatmap",
            paint: {
              "heatmap-weight": ["interpolate", ["linear"], ["get", "mag"], 0, 0, 6, 1],
              "heatmap-intensity": 1,
              "heatmap-radius": 20,
              "heatmap-opacity": 0.8,
            },
          }}
        />
      </Source>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
