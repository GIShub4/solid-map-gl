import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Source, Layer } from "solid-map-gl";
import { Protocol } from "pmtiles";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// ProtoMaps ships vector tiles as a single `.pmtiles` file over plain HTTP
// range requests — `pmtiles`'s Protocol registers the `pmtiles://` scheme
// with the map library before any source references it.
const protocol = new Protocol();
mapboxgl.addProtocol("pmtiles", protocol.tile);

const PMTILES_URL =
  "https://protomaps.github.io/basemaps-assets/protomaps(vector)ODbL_firenze.pmtiles";

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [11.2558, 43.7696],
    zoom: 12,
  } as Viewport);

  return (
    <MapGL
      options={{ style: { version: 8, sources: {}, layers: [] } }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Source source={{ type: "vector", url: `pmtiles://${PMTILES_URL}` }}>
        <Layer
          style={{
            "source-layer": "roads",
            type: "line",
            paint: { "line-color": "#666", "line-width": 1 },
          }}
        />
      </Source>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
