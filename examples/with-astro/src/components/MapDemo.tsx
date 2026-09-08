import { createSignal } from "solid-js";
import type { Component } from "solid-js";
import MapGL, { Source, Layer } from "solid-map-gl";
import type { Viewport } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Astro only exposes client-side env vars prefixed `PUBLIC_`, not Vite's `VITE_` — pass the token
// explicitly rather than relying on MapGL's built-in `VITE_MAPBOX_ACCESS_TOKEN` fallback.
const MapDemo: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.45, 37.78],
    zoom: 11,
  } as Viewport);

  return (
    <MapGL
      options={{
        accessToken: import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN,
        style: "mb:light",
      }}
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
            type: "circle",
            paint: {
              "circle-radius": 8,
              "circle-color": "red",
            },
          }}
        />
      </Source>
    </MapGL>
  );
};

export default MapDemo;
