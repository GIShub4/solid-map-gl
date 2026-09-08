import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, useMapContext } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Setting `viewport.bounds` fits the map to a [[sw], [ne]] box via
// map.cameraForBounds (see MapGL/index.tsx's viewport effect). Nested
// components can also reach the raw map instance directly via
// useMapContext(), read here just to log it once loaded.
const sanFrancisco: [[number, number], [number, number]] = [
  [-122.52, 37.7],
  [-122.35, 37.83],
];

const MapReadyLogger: Component = () => {
  const [ctx] = useMapContext();
  console.log("map instance from context:", ctx.map);
  return null;
};

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.41, 37.78],
    zoom: 11,
  } as Viewport);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <MapReadyLogger />
      <button
        style={{ position: "absolute", top: "10px", left: "10px" }}
        onClick={() =>
          setViewport((vp) => ({ ...vp, bounds: sanFrancisco }))
        }
      >
        Fit to San Francisco
      </button>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
