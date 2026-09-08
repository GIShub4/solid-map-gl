import { render } from "solid-js/web";
import { Component } from "solid-js";
import MapGL from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// By default MapGL renders in static mode — the user cannot pan/zoom it.
const App: Component = () => (
  <MapGL
    options={{
      accessToken: MAPBOX_ACCESS_TOKEN,
      style: "mb:basic",
    }}
    viewport={{
      center: [-122.41, 37.78],
      zoom: 11,
    }}
  />
);

render(() => <App />, document.getElementById("root")!);
