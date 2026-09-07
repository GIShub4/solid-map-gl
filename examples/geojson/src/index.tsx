import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const data = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: [
      [-122.48369693756104, 37.83381888486939],
      [-122.48348236083984, 37.83317489144141],
      [-122.48339653015138, 37.83270036637107],
      [-122.48404026031496, 37.83114119107971],
      [-122.48610019683838, 37.82880236636284],
      [-122.48751640319824, 37.83168351665737],
      [-122.48987674713133, 37.83263257682617],
      [-122.49378204345702, 37.83368330777276],
    ],
  },
};

// <Source> takes an inline GeoJSON object directly — no `id` needed here
// since the nested <Layer> picks up the source id from context.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.486052, 37.830348],
    zoom: 14,
  } as Viewport);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Source source={{ type: "geojson", data }}>
        <Layer
          style={{
            type: "line",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#F88", "line-width": 8 },
          }}
        />
      </Source>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
