import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// An `image` source drapes a single static image over four georeferenced
// corner coordinates ([top-left, top-right, bottom-right, bottom-left]).
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-80.425, 46.437],
    zoom: 5,
  } as Viewport);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Source
        source={{
          type: "image",
          url: "https://docs.mapbox.com/mapbox-gl-js/assets/radar.gif",
          coordinates: [
            [-80.425, 46.437],
            [-71.516, 46.437],
            [-71.516, 37.936],
            [-80.425, 37.936],
          ],
        }}
      >
        <Layer style={{ type: "raster", paint: { "raster-fade-duration": 0 } }} />
      </Source>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
