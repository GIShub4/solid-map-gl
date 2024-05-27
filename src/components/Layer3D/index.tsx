import {
  onCleanup,
  Component,
  createUniqueId,
  createSignal,
  onMount,
  createContext,
  useContext,
  JSX,
} from "solid-js";
import { unwrap } from "solid-js/store";
import { useMapContext } from "../MapProvider";

declare global {
  interface Window {
    BABYLON?: any;
    THREE?: any;
  }
}

type Props = {
  id?: string;
  origin?: [number, number, number?]; // [lng, lat, altitude]
  defaultLight?: boolean;
  babylon?: boolean;
  onAdd?: (scene: any, map: any, gl: any) => void;
  onRender?: (gl: any, matrix: any) => void;
  children?: JSX.Element | JSX.Element[];
  /** A string that specifies the type of layer before which the current layer should be inserted. */
  beforeId?: string;
  disableProjectionMatrix?: boolean;
};

const LayerContext = createContext<any>();
export const useScene = (): any => useContext(LayerContext);

export const Layer3D: Component<Props> = (props) => {
  const [ctx] = useMapContext();
  const [scene, setScene] = createSignal(null);

  onMount(async () => {
    props.id = props.id || createUniqueId();

    const worldOriginMercator = window.MapLib.MercatorCoordinate.fromLngLat(
      [props.origin[0] || 0, props.origin[1] || 0],
      props.origin[2] || 0,
    );
    const worldScale = worldOriginMercator.meterInMercatorCoordinateUnits();
    const { x, y, z } = worldOriginMercator;

    let worldMatrix = null;
    let BABYLON = null;
    let THREE = null;

    if (props.babylon) {
      BABYLON = await import("@babylonjs/core");
      worldMatrix = BABYLON.Matrix.Compose(
        new BABYLON.Vector3(worldScale, worldScale, worldScale),
        BABYLON.Quaternion.FromEulerAngles(Math.PI / 2, 0, 0),
        new BABYLON.Vector3(x, y, z),
      );
    } else {
      THREE = await import("three");
      worldMatrix = {
        translateX: x,
        translateY: y,
        translateZ: z,
        rotateX: Math.PI / 2,
        rotateY: 0,
        rotateZ: 0,
        scale: worldScale,
      };
    }

    ctx.map.addLayer(
      {
        id: props.id,
        type: "custom",
        renderingMode: "3d",
        onAdd(map, gl) {
          if (props.babylon) {
            const engine = new BABYLON.Engine(
              gl,
              true,
              {
                useHighPrecisionMatrix: true,
              },
              true,
            );
            this.scene = new BABYLON.Scene(engine);
            this.scene.autoClear = false;
            this.scene.autoClearDepthAndStencil = false;
            // this.scene.detachControl();
            this.scene.preventDefaultOnPointerDown = false;
            this.scene.preventDefaultOnPointerUp = false;
            this.scene.beforeRender = () => engine.wipeCaches(true);
            this.scene.activeCamera = new BABYLON.UniversalCamera(
              "Camera",
              BABYLON.Vector3.Zero(),
              this.scene,
            );
            // this.scene.activeCamera.setTarget(BABYLON.Vector3.Zero());
            // this.camera.inputs.addMouseWheel()
            // this.scene.activeCamera.attachControl(gl, true);
            this.scene.ambientColor = new BABYLON.Color3(1, 1, 1);
            if (props.defaultLight)
              new BABYLON.HemisphericLight(
                "Light",
                new BABYLON.Vector3(100, 10, 0),
                this.scene,
              );
          } else {
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();
            if (props.defaultLight) {
              this.light = new THREE.DirectionalLight(0xffffff);
              this.light.position.set(100, 0, 0).normalize();
              this.scene.add(this.light);
            }

            this.renderer = new THREE.WebGLRenderer({
              canvas: map.getCanvas(),
              context: gl,
              antialias: true,
            });
            this.renderer.autoClear = false;
          }
          this.map = map;
          props.onAdd && props.onAdd(this.scene, this.map, gl);
          setScene(this.scene);
        },
        render(gl, matrix) {
          if (props.babylon) {
            this.scene.activeCamera.freezeProjectionMatrix(
              props.disableProjectionMatrix
                ? BABYLON.Matrix.FromArray(matrix)
                : worldMatrix.multiply(BABYLON.Matrix.FromArray(matrix)),
            );
            // const { x, y, z } = this.map.getFreeCameraOptions().position;
            // this.scene.activeCamera.setPosition(new BABYLON.Vector3(x, y, z));
            // console.log(this.scene.activeCamera);
            // this.camera.position = BABYLON.Vector3.TransformCoordinates(
            //   new BABYLON.Vector3(x, y, z),
            //   this.scene.activeCamera.getProjectionMatrix().clone().invert(),
            // );
            this.scene.render(false);
          } else {
            const rotationX = new THREE.Matrix4().makeRotationAxis(
              new THREE.Vector3(1, 0, 0),
              worldMatrix.rotateX,
            );
            const rotationY = new THREE.Matrix4().makeRotationAxis(
              new THREE.Vector3(0, 1, 0),
              worldMatrix.rotateY,
            );
            const rotationZ = new THREE.Matrix4().makeRotationAxis(
              new THREE.Vector3(0, 0, 1),
              worldMatrix.rotateZ,
            );

            const m = new THREE.Matrix4().fromArray(matrix);
            const l = new THREE.Matrix4()
              .makeTranslation(
                worldMatrix.translateX,
                worldMatrix.translateY,
                worldMatrix.translateZ,
              )
              .scale(
                new THREE.Vector3(
                  worldMatrix.scale,
                  -worldMatrix.scale,
                  worldMatrix.scale,
                ),
              )
              .multiply(rotationX)
              .multiply(rotationY)
              .multiply(rotationZ);
            this.camera.projectionMatrix = m.multiply(l);
            this.renderer.resetState();
            this.renderer.render(this.scene, this.camera);
          }
          props.onRender && props.onRender(gl, matrix);
          ctx.map.triggerRepaint();
        },
      },
      props.beforeId,
    );
  });

  onCleanup(() => {
    ctx.map.getLayer(props.id) && ctx.map.removeLayer(props.id);
  });

  return (
    <LayerContext.Provider value={scene}>
      {scene() && props.children}
    </LayerContext.Provider>
  );
};
