import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Atmosphere } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// `options.projection: "globe"` renders the map as a 3D globe; <Atmosphere>
// (Mapbox `Fog` shape here — see its README for the MapLibre `Sky` shape)
// adds the space/atmosphere backdrop around it.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-40, 30],
    zoom: 1.5,
  } as Viewport);

  return (
    <MapGL
      options={{
        accessToken: MAPBOX_ACCESS_TOKEN,
        style: "mb:sat_street",
        projection: "globe",
      }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Atmosphere
        style={{
          color: "white",
          "space-color": "#000011",
          "horizon-blend": 0.02,
          "star-intensity": 0.5,
        }}
      />
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
