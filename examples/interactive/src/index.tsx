import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Passing onViewportChange makes the map interactive — pan/zoom feed back
// into the viewport signal instead of being ignored.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.41, 37.78],
    zoom: 11,
  } as Viewport);

  return (
    <MapGL
      options={{
        accessToken: MAPBOX_ACCESS_TOKEN,
        style: "mb:light",
      }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    />
  );
};

render(() => <App />, document.getElementById("root")!);
