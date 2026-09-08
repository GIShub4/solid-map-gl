import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// A `video` source drapes a playing <video> over four georeferenced corner
// coordinates, same shape as an `image` source but with multiple `urls` for
// browser-format fallback.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.514426, 37.562984],
    zoom: 17,
  } as Viewport);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Source
        source={{
          type: "video",
          urls: [
            "https://static-assets.mapbox.com/mapbox-gl-js/drone.mp4",
            "https://static-assets.mapbox.com/mapbox-gl-js/drone.webm",
          ],
          coordinates: [
            [-122.51596391201019, 37.56238816766053],
            [-122.51467645168304, 37.56410183312965],
            [-122.51309394836426, 37.563391708549425],
            [-122.51423120498657, 37.56161849366671],
          ],
        }}
      >
        <Layer style={{ type: "raster" }} />
      </Source>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
