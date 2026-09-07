import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Marker } from "solid-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// <Marker> is draggable and owns an optional popup (`showPopup` + children)
// — dragging updates `lngLat` reactively via onDrag/onDragEnd.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [0, 52],
    zoom: 6,
  } as Viewport);
  const [lngLat, setLngLat] = createSignal<[number, number]>([0, 52]);
  const [showPopup, setShowPopup] = createSignal(false);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:dark" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Marker
        lngLat={lngLat()}
        options={{ draggable: true, color: "#F00" }}
        showPopup={showPopup()}
        onDragEnd={(newLngLat) => setLngLat(newLngLat as [number, number])}
        onOpen={() => setShowPopup(true)}
        onClose={() => setShowPopup(false)}
      >
        Drag me! Current position: {lngLat()[0].toFixed(2)},{" "}
        {lngLat()[1].toFixed(2)}
      </Marker>
      <button
        style={{ position: "absolute", top: "10px", left: "10px" }}
        onClick={() => setShowPopup((v) => !v)}
      >
        Toggle popup
      </button>
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
