import { render } from "solid-js/web";
import { Component, createSignal, For } from "solid-js";
import MapGL, { Viewport, Source, Image, Layer } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Three markers, each demonstrating a different <Layer> `pulse` shape — see docs/COMPONENTS.md's
// "Layer" section (or Layer/README.md) for the full pulse API. Every cycle is a "ping": reset to
// `from`, ramp to `to` (via Mapbox's own paint-property transition, not a per-frame loop), hold,
// repeat — so the map genuinely goes idle between pings instead of staying dirty forever.
const markers: { coordinates: [number, number]; label: string; pulse: any }[] = [
  {
    label: "ring: grows outward and fades, then resets (the classic 'pulsing dot')",
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
    label: "mostly held: a short ramp, then a long hold before the next ping",
    coordinates: [-77.4, 25.085],
    pulse: [
      { property: "icon-halo-width", from: 0, to: 16, holdFraction: 0.85 },
      {
        property: "icon-halo-color",
        from: "rgba(37, 99, 235, 1)",
        to: "rgba(37, 99, 235, 0)",
        holdFraction: 0.85,
      },
    ],
  },
  {
    label: "halo-only fade: width stays fixed, only transparency changes",
    coordinates: [-77.45, 25.03],
    pulse: {
      property: "icon-halo-color",
      from: "rgba(37, 99, 235, 1)",
      to: "rgba(37, 99, 235, 0.15)",
    },
  },
];

const App: Component = () => {
  const [viewport, setViewport] = createSignal<Viewport>({
    center: [-77.425, 25.0575],
    zoom: 12,
  });

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
