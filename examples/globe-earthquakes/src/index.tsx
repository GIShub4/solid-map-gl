import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer, Camera, Atmosphere } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Public demo token, intentionally committed — restricted (Mapbox account → Tokens → URL
// restrictions) to StackBlitz's preview domains + gishub4.github.io + localhost, so this example
// works with zero setup when forked. Not a secret; fork it and swap in your own token if you plan
// to use this outside those domains. Get your own at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1Ijoia2FpaHVlYm5lciIsImEiOiJjbXRzMXQ0dWkwNmt6MnlwcnB0OGllcjV2In0.DL0zjliBpl5P-8yoetSpUA";

// `options.projection: "globe"` renders the map as a 3D globe; `<Camera rotateGlobe>` spins it
// automatically until the user interacts with the map (see Camera's README for the option shape).
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [40, -10],
    zoom: 2,
  } as Viewport);
  const [rotation, setRotation] = createSignal(true);

  return (
    <MapGL
      options={{
        accessToken: MAPBOX_ACCESS_TOKEN,
        style: "mb:outdoor",
        projection: "globe",
      }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <button
        style={{ position: "absolute", top: "10px", left: "10px", "z-index": 1 }}
        onClick={() => setRotation((r) => !r)}
      >
        Toggle rotation
      </button>
      <Camera rotateGlobe={rotation()} />
      <Atmosphere />
      <Source
        source={{
          type: "geojson",
          data: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
        }}
      >
        <Layer
          style={{
            type: "circle",
            radius: ["*", ["get", "mag"], 2],
            color: ["match", ["get", "tsunami"], 0, "#F00", 1, "#03A", "#CCC"],
            opacity: 0.5,
            strokeWidth: 0.25,
            pitchAlignment: "map",
          }}
          beforeType="symbol"
        />
      </Source>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root") as HTMLElement);
