import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Two <MapGL>s sharing one viewport signal + the same `id` stay in sync:
// each map only re-applies an incoming viewport update when its own `id`
// matches the one that produced it (see MapGL/index.tsx's viewport effect),
// which is also how a single map avoids feeding its own movement back into
// itself.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    id: "synced",
    center: [-122.41, 37.78],
    zoom: 11,
  } as Viewport);

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <div style={{ width: "50%", height: "100%" }}>
        <MapGL
          id="synced"
          options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
          viewport={viewport()}
          onViewportChange={(evt: Viewport) => setViewport(evt)}
        />
      </div>
      <div style={{ width: "50%", height: "100%" }}>
        <MapGL
          id="synced"
          options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:dark" }}
          viewport={viewport()}
          onViewportChange={(evt: Viewport) => setViewport(evt)}
        />
      </div>
    </div>
  );
};

render(() => <App />, document.getElementById("root")!);
