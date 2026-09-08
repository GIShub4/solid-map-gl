import { render } from "solid-js/web";
import { Component, createSignal, For } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const rasterStyles = {
  "osm:org": "OpenStreetMap",
  "carto:voyager": "Carto Voyager",
  "carto:dark": "Carto Dark",
};

// Swapping a raster <Source>'s `url` reactively re-points the tile source —
// no base MapGL `style` swap needed for a pure-raster basemap.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.41, 37.78],
    zoom: 10,
  } as Viewport);
  const [url, setUrl] = createSignal("osm:org");

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Source source={{ type: "raster", url: url(), tileSize: 256 }}>
        <Layer style={{ type: "raster" }} />
      </Source>
      <div style={{ position: "absolute", top: "10px", left: "10px" }}>
        <For each={Object.entries(rasterStyles)}>
          {([value, label]) => (
            <button onClick={() => setUrl(value)}>{label}</button>
          )}
        </For>
      </div>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
