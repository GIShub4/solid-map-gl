import { render } from "solid-js/web";
import { Component, createSignal, onCleanup } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const randomPoint = (center: [number, number]) => ({
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "Point" as const,
    coordinates: [
      center[0] + (Math.random() - 0.5) * 0.2,
      center[1] + (Math.random() - 0.5) * 0.2,
    ],
  },
});

// Re-setting `source.data` on every tick exercises <Source>'s reactive
// setData path — it calls map.getSource(id).setData(...) rather than
// recreating the source, and keeps working even mid-tile-load.
const App: Component = () => {
  const center: [number, number] = [-122.41, 37.78];
  const [viewport, setViewport] = createSignal({
    center,
    zoom: 10,
  } as Viewport);
  const [features, setFeatures] = createSignal([randomPoint(center)]);

  const timer = setInterval(() => {
    setFeatures((f) => [...f, randomPoint(center)].slice(-50));
  }, 1000);
  onCleanup(() => clearInterval(timer));

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Source
        source={{
          type: "geojson",
          data: { type: "FeatureCollection", features: features() },
        }}
      >
        <Layer
          style={{
            type: "circle",
            paint: { "circle-radius": 5, "circle-color": "#1978c8" },
          }}
        />
      </Source>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
