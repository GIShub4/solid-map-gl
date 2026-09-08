import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// A "swipe compare" is two synced maps (see the `sync` example for how the
// shared `id` keeps them in lockstep) stacked absolutely, with the top one
// clipped by a slider-controlled clip-path.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    id: "compare",
    center: [-122.41, 37.78],
    zoom: 11,
  } as Viewport);
  const [split, setSplit] = createSignal(50);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ position: "absolute", inset: "0" }}>
        <MapGL
          id="compare"
          options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
          viewport={viewport()}
          onViewportChange={(evt: Viewport) => setViewport(evt)}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: "0",
          "clip-path": `inset(0 0 0 ${split()}%)`,
        }}
      >
        <MapGL
          id="compare"
          options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:dark" }}
          viewport={viewport()}
          onViewportChange={(evt: Viewport) => setViewport(evt)}
        />
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={split()}
        onInput={(e) => setSplit(Number(e.currentTarget.value))}
        style={{
          position: "absolute",
          bottom: "20px",
          left: "10%",
          width: "80%",
          "z-index": 1,
        }}
      />
    </div>
  );
};

render(() => <App />, document.getElementById("root")!);
