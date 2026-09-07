import { render } from "solid-js/web";
import { Component, createSignal, For } from "solid-js";
import MapGL, { Viewport } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Style shorthands (`mb:*`) are resolved by MapGL against src/mapStyles.ts's
// vectorStyleList — swapping `style` at runtime hot-swaps the base map.
const styles = ["light", "dark", "street", "outdoor", "sat_street"];

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-122.45, 37.78],
    zoom: 11,
  } as Viewport);
  const [style, setStyle] = createSignal("light");

  return (
    <MapGL
      options={{
        accessToken: MAPBOX_ACCESS_TOKEN,
        style: `mb:${style()}`,
      }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <div style={{ position: "absolute", top: "10px", left: "10px" }}>
        <For each={styles}>
          {(s) => <button onClick={() => setStyle(s)}>{s}</button>}
        </For>
      </div>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
