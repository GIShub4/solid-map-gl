import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Terrain, useMapContext } from "solid-map-gl";
import type { MapMouseEvent } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// map.queryTerrainElevation() needs the raw map instance — reach it via
// useMapContext() from a component nested under <MapGL>.
const ElevationOnClick: Component<{
  onElevation: (m: number | null) => void;
}> = (props) => {
  const [ctx] = useMapContext();
  ctx.map.on("click", (evt: MapMouseEvent) => {
    props.onElevation(ctx.map.queryTerrainElevation(evt.lngLat));
  });
  return null;
};

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [138.74, 35.3],
    zoom: 11,
    pitch: 60,
  } as Viewport);
  const [elevation, setElevation] = createSignal<number | null>(null);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:sat" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Terrain exaggeration={1.5} />
      <ElevationOnClick onElevation={setElevation} />
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "white",
          padding: "4px 8px",
        }}
      >
        Click the map to query elevation
        {elevation() !== null ? `: ${elevation()!.toFixed(1)}m` : ""}
      </div>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
