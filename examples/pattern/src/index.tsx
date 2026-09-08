import { render } from "solid-js/web";
import { Component, createSignal, For } from "solid-js";
import MapGL, { Viewport, Source, Layer, Image, patternList } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// <Image pattern={...}> procedurally generates one of patternList's
// built-in hatch/geometric SVG patterns instead of loading an image file —
// swapping `pattern.type` reactively regenerates the registered image.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.45, 37.78],
    zoom: 11,
  } as Viewport);
  const [pattern, setPattern] = createSignal(patternList[0]);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Image
        id="fill-pattern"
        pattern={{
          type: pattern(),
          color: "#1978c8",
          background: "#ffffff",
          lineWith: 2,
        }}
      />
      <Source
        source={{
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-122.48, 37.83],
                  [-122.45, 37.83],
                  [-122.45, 37.8],
                  [-122.48, 37.8],
                  [-122.48, 37.83],
                ],
              ],
            },
          },
        }}
      >
        <Layer style={{ type: "fill", paint: { "fill-pattern": "fill-pattern" } }} />
      </Source>
      <div style={{ position: "absolute", top: "10px", left: "10px" }}>
        <For each={patternList}>
          {(p) => <button onClick={() => setPattern(p)}>{p}</button>}
        </For>
      </div>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
