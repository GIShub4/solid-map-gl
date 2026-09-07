import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Vector sources need `source-layer` on the <Layer> style — it picks which
// layer inside the vector tile's own schema to render.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.447303, 37.753574],
    zoom: 13,
  } as Viewport);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Source source={{ type: "vector", url: "mapbox://mapbox.mapbox-terrain-v2" }}>
        <Layer
          style={{
            "source-layer": "contour",
            type: "line",
            paint: {
              "line-width": 2,
              "line-color": "hsla(200, 50%, 50%, 0.5)",
            },
          }}
        />
      </Source>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
