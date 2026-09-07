import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// MapGL swaps to `darkStyle` automatically when the OS/browser reports
// `prefers-color-scheme: dark`, or when `document.body` gains a `dark` class
// — toggle the button below to see the latter.
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
      darkStyle="mb:dark"
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <button
        style={{ position: "absolute", top: "10px", left: "10px" }}
        onClick={() => document.body.classList.toggle("dark")}
      >
        Toggle dark theme
      </button>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
