import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Image, Layer } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// <Image> registers a sprite via map.addImage(id, ...) so a symbol layer's
// icon-image can reference it by id.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-77.4144, 25.0759],
    zoom: 6,
  } as Viewport);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Image id="cat" source="https://docs.mapbox.com/mapbox-gl-js/assets/cat.png" />
      <Source
        source={{
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: { type: "Point", coordinates: [-77.4144, 25.0759] },
              },
            ],
          },
        }}
      >
        <Layer
          style={{
            type: "symbol",
            layout: { "icon-image": "cat", "icon-size": 0.25 },
          }}
        />
      </Source>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
