import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Layer3D } from "solid-map-gl";
import { SceneLoader } from "@babylonjs/core/Loading";
import "@babylonjs/loaders";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// <Layer3D babylon> bridges to a BabylonJS Scene via a Mapbox
// CustomLayerInterface — `origin` anchors the scene's [0,0,0] to a real-world
// lng/lat, and onAdd receives the constructed Scene to populate.
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
        babylon
        defaultLight
        origin={[148.9819, -35.39847]}
        onAdd={(scene) => {
          SceneLoader.LoadAssetContainerAsync(
            "https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/",
            "34M_17.gltf",
            scene,
          ).then((container: any) => container.addAllToScene());
        }}
      />
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
