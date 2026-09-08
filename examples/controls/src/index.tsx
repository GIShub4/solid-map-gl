import { render } from "solid-js/web";
import { Component, createSignal, For, Show } from "solid-js";
import MapGL, { Viewport, Control } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Controls without a built-in `type` (traffic via @mapbox/mapbox-gl-traffic,
// a geocoder via @mapbox/mapbox-gl-geocoder, ...) aren't part of Mapbox's
// core control set — install the package you need and pass an
// already-constructed instance via `custom` instead of `type`, e.g.:
//   import MapboxTraffic from "@mapbox/mapbox-gl-traffic";
//   <Control custom={new MapboxTraffic()} position="top-left" />
const controlTypes = ["navigation", "scale", "fullscreen", "geolocate"] as const;

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [0, 52],
    zoom: 6,
  } as Viewport);
  const [enabled, setEnabled] = createSignal<Set<string>>(
    new Set(["navigation"]),
  );

  const toggle = (type: string) =>
    setEnabled((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <For each={controlTypes}>
        {(type) => (
          <Show when={enabled().has(type)}>
            <Control type={type} position="top-left" />
          </Show>
        )}
      </For>
      <div style={{ position: "absolute", bottom: "10px", left: "10px" }}>
        <For each={controlTypes}>
          {(type) => (
            <label style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={enabled().has(type)}
                onChange={() => toggle(type)}
              />
              {type}
            </label>
          )}
        </For>
      </div>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
