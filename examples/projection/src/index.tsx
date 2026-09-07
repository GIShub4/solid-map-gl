import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// `options.projection` is forwarded straight to mapbox-gl's Map constructor
// and re-applied reactively — see the style-spec's `projection` property.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-40, 30],
    zoom: 1.5,
  } as Viewport);
  const [projection, setProjection] = createSignal<"mercator" | "globe">(
    "globe",
  );

  return (
    <MapGL
      options={{
        accessToken: MAPBOX_ACCESS_TOKEN,
        style: "mb:light",
        projection: projection(),
      }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <button
        style={{ position: "absolute", top: "10px", left: "10px" }}
        onClick={() =>
          setProjection((p) => (p === "globe" ? "mercator" : "globe"))
        }
      >
        Switch to {projection() === "globe" ? "mercator" : "globe"}
      </button>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
