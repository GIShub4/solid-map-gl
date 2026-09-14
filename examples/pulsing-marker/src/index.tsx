import { render } from "solid-js/web";
import { Component, createSignal, For } from "solid-js";
import MapGL, { Viewport, Source, Image, Layer } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Four markers, each demonstrating a different <Layer> `pulse` waveform — see
// docs/COMPONENTS.md's "Layer" section (or Layer/README.md) for the full pulse API.
const markers: { coordinates: [number, number]; label: string; pulse: any }[] = [
  {
    // `waveform` defaults to "out" — this marker just uses `pulse`'s own defaults.
    label: "out (default): ping — grows outward and fades, then resets",
    coordinates: [-77.45, 25.085],
    pulse: [
      { property: "icon-halo-width", from: 0, to: 16 },
      {
        property: "icon-halo-color",
        from: "rgba(37, 99, 235, 1)",
        to: "rgba(37, 99, 235, 0)",
      },
    ],
  },
  {
    label: "in: the mirror of ping — collapses inward",
    coordinates: [-77.4, 25.085],
    pulse: [
      { property: "icon-halo-width", from: 0, to: 16, waveform: "in" },
      {
        property: "icon-halo-color",
        from: "rgba(37, 99, 235, 1)",
        to: "rgba(37, 99, 235, 0)",
        waveform: "in",
      },
    ],
  },
  {
    label: "in-out: halo breathes continuously, no reset",
    coordinates: [-77.45, 25.03],
    pulse: { from: 0, to: 10, waveform: "in-out" },
  },
  {
    label: "halo-only fade: width stays fixed, only transparency changes",
    coordinates: [-77.4, 25.03],
    pulse: {
      property: "icon-halo-color",
      from: "rgba(37, 99, 235, 1)",
      to: "rgba(37, 99, 235, 0.15)",
      waveform: "in-out",
    },
  },
];

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [-77.425, 25.0575],
    zoom: 12,
  } as Viewport);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      {/* Shared SDF icon — `sdf` is what lets icon-color/icon-halo-* below be driven by
          paint properties (and therefore by `pulse`) instead of being baked into the image. */}
      <Image id="dot" symbol="circle" sdf />
      <For each={markers}>
        {(marker) => (
          <Source
            source={{
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    properties: { label: marker.label },
                    geometry: { type: "Point", coordinates: marker.coordinates },
                  },
                ],
              },
            }}
          >
            <Layer
              style={{
                type: "symbol",
                layout: {
                  "icon-image": "dot",
                  "icon-size": 0.4,
                  "icon-allow-overlap": true,
                  "text-field": ["get", "label"],
                  "text-offset": [0, 2],
                  "text-anchor": "top",
                  "text-size": 11,
                  "text-allow-overlap": true,
                },
                paint: {
                  "icon-color": "#2563eb",
                  "icon-halo-color": "#2563eb",
                  "text-halo-color": "#fff",
                  "text-halo-width": 1,
                },
              }}
              pulse={marker.pulse}
            />
          </Source>
        )}
      </For>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
