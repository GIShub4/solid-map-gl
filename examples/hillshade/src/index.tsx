import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// A `hillshade` layer reads the same `raster-dem` source Terrain uses, but
// renders shaded relief instead of (or alongside) 3D elevation.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [138.74, 35.3],
    zoom: 10,
  } as Viewport);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Source
        source={{
          type: "raster-dem",
          url: "mapbox://mapbox.terrain-rgb",
          tileSize: 512,
          maxzoom: 14,
        }}
      >
        <Layer style={{ type: "hillshade" }} />
      </Source>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
