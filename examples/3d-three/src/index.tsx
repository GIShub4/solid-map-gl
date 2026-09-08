import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Layer3D } from "solid-map-gl";
import * as THREE from "three";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Without `babylon`, <Layer3D> bridges to a plain THREE.Scene instead —
// onAdd receives the Scene (already anchored to `origin`'s lng/lat) to
// populate; the camera/projection matrix per frame is handled internally.
const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [148.9819, -35.3981],
    zoom: 18,
    pitch: 60,
  } as Viewport);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:light", antialias: true }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Layer3D
        defaultLight
        origin={[148.9819, -35.39847, 0]}
        onAdd={(scene: THREE.Scene) => {
          const cube = new THREE.Mesh(
            new THREE.BoxGeometry(20, 20, 20),
            new THREE.MeshPhongMaterial({ color: 0xff0000 }),
          );
          cube.position.set(0, 0, 10);
          scene.add(cube);
        }}
      />
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
