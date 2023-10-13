---
description: Layer 3D Component
---

# Layer3D

## Props

| Name         | Type                                   | Description                                                                                                      |
| ------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| origin       | object [x: number, y:number, z:number] | The origin of the 3D model                                                                                       |
| babylon\*    | boolean                                | Flag to indicate using [BabylonJS](https://www.babylonjs.com/) otherwise [ThreeJS](https://threejs.org/) library |
| defaultLight | boolean                                | Default light for the scene                                                                                      |
| onAdd        | function                               | Function to create the scene after layer is added                                                                |
| onRender     | function                               | Function to implement functionallity on each render cycle                                                        |

_\*required_

## Example

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Layer3D } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { SceneLoader } from '@babylonjs/core/Loading';
import '@babylonjs/loaders';

const [viewport, setViewport] = createSignal({
  center: [148.9819, -35.3981],
  zoom: 18,
  pitch: 60,
} as Viewport);

const App: Component = () => (
  <MapGL
    options={{ style: 'mb:light', antialias: true }}
    viewport={viewport()}
    onViewportChange={(evt: Viewport) => setViewport(evt)}
  >
    <Layer3D
      babylon
      defaultLight
      origin={[148.9819, -35.39847]}
      onAdd={(scene) => {
        SceneLoader.LoadAssetContainerAsync(
          'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/',
          '34M_17.gltf',
          scene
        ).then((modelContainer: any) => modelContainer.addAllToScene());
      }}
    />
  </MapGL>
);
```
