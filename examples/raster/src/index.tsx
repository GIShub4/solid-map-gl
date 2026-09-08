import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Raster style shorthands (`osm:*`, `carto:*`, ...) live in
// src/mapStyles.ts's rasterStyleList and resolve to XYZ tile URL templates.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.41, 37.78],
    zoom: 10,
  } as Viewport);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Source source={{ type: "raster", url: "osm:org", tileSize: 256 }}>
        <Layer style={{ type: "raster" }} />
      </Source>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
