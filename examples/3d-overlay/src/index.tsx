import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Layer } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// A `fill-extrusion` layer against Mapbox's `composite` source's
// `building` layer renders the standard "3D buildings" overlay — no
// <Source> needed since it targets a layer already baked into the style.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-74.0066, 40.7135],
    zoom: 15.5,
    pitch: 45,
    bearing: -17.6,
  } as Viewport);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Layer
        sourceId="composite"
        style={{
          "source-layer": "building",
          type: "fill-extrusion",
          filter: ["==", "extrude", "true"],
          paint: {
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "min_height"],
            "fill-extrusion-opacity": 0.6,
          },
        }}
      />
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
