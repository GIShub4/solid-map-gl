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
import { Logger } from "@babylonjs/core";

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

const deg2rad = (degrees: number) => {
  return (degrees * Math.PI) / 180;
};

const latLng2Mercator = (lat: number, lng: number, altitude: number) => {
  const R = 6378137.0; // earth radius in meters
  const x = R * deg2rad(lng);
  const y = R * Math.log(Math.tan(Math.PI / 4 + deg2rad(lat) / 2));
  return [x, y, altitude];
};

const latLng2Cartesian = ({ lat, lng }, altitude: number = 0) => {
  const R = 6378137.0; // earth radius in meters
  const x = R * Math.cos(deg2rad(lat)) * Math.cos(deg2rad(lng));
  const y = R * Math.cos(deg2rad(lat)) * Math.sin(deg2rad(lng));
  const z = altitude; // + R * Math.sin(deg2rad(lat));
  return { x, y, z };
};

const LayerContext = createContext<any>();
export const useScene = (): any => useContext(LayerContext);

export const Layer3D: Component<Props> = (props) => {
  const [ctx] = useMapContext();
  const [scene, setScene] = createSignal(null);

  onMount(async () => {
    props.id = props.id || createUniqueId();

    const worldOriginMercator = ctx.mapLib.MercatorCoordinate.fromLngLat(
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
            // this.index = 0;

            this.scene = new BABYLON.Scene(engine);
            this.scene.autoClear = false;
            // this.scene.autoClearDepthAndStencil = false;
            // this.scene.detachControl();
            this.scene.preventDefaultOnPointerDown = false;
            this.scene.preventDefaultOnPointerUp = false;
            // this.scene.beforeRender = () => engine.wipeCaches(true);
            const camera = new BABYLON.UniversalCamera(
              "Camera",
              BABYLON.Vector3.Zero(),
            );
            camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
            camera.inertia = 0;
            // this.scene.activeCamera.setTarget(new BABYLON.Vector3(-1, 0, 0));
            // this.scene.activeCamera.rotationQuaternion =
            //   BABYLON.Quaternion.Identity();
            // this.scene.activeCamera.updateUpVectorFromRotation = true;

            // this.scene.activeCamera.noRotationConstraint = true;
            // this.scene.activeCamera.inputs.addMouseWheel();
            // this.scene.activeCamera.setTarget(BABYLON.Vector3.Zero());
            // setTimeout(() => {
            //   this.scene.activeCamera.setPosition(
            //     new BABYLON.Vector3(100, 100, 100),
            //   );
            // }, 2000);
            // this.scene.activeCamera.attachControl(gl.canvas, true);
            this.scene.ambientColor = new BABYLON.Color3(1, 1, 1);
            if (props.defaultLight)
              new BABYLON.HemisphericLight(
                "Light",
                new BABYLON.Vector3(100, 10, 0),
                this.scene,
              );
            // this.scene.root_node = new BABYLON.TransformNode("rootNode");
            // this.scene.root_node.lookAt(BABYLON.Vector3.Down());
            // this.scene.root_node.addRotation(0, 0, Math.PI / 2);
            // const axis = new BABYLON.AxesViewer(this.scene, 100);
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
              // props.disableProjectionMatrix
              //   ? BABYLON.Matrix.FromArray(matrix)
              worldMatrix.multiply(BABYLON.Matrix.FromArray(matrix)),
            );

            // this.scene.activeCamera.position =
            //   BABYLON.Vector3.TransformCoordinates(
            //     new BABYLON.Vector3(),
            //     worldMatrix.multiply(BABYLON.Matrix.FromArray(matrix)).invert(),
            //   );

            // this.scene.activeCamera.rotation.z = matrix[0];
            // this.scene.activeCamera.rotation.x = matrix[1];
            // this.scene.activeCamera.rotation.y = matrix[2];

            // console.log(this.scene.activeCamera.getProjectionMatrix(), matrix);

            // const m = matrix;

            // const transform = BABYLON.Matrix.FromArray(matrix);
            // console.log(transform);
            //
            // const center = this.map.getCenter();
            // const zoom = this.map.getZoom();
            // const scale = Math.pow(2, zoom);
            // const centerX = center.lng * scale;
            // const centerZ = center.lat * scale;
            // this.scene.activeCamera.position.x = centerX;
            // this.scene.activeCamera.position.z = centerZ;

            // this.scene.activeCamera.getWorldMatrix().copyFrom(transform);

            const pitch = this.map.getPitch() * (Math.PI / 180);
            const bearing = this.map.getBearing() * (Math.PI / 180);

            // this.scene.activeCamera.rotation.x = Math.asin(pitch);
            // this.scene.activeCamera.rotation.y = Math.atan(bearing / pitch);
            // this.scene.activeCamera.rotation.z = -bearing;

            // this.scene.activeCamera
            //   .getWorldMatrix()
            //   .invertToRef(this.scene.activeCamera.getViewMatrix());

            // const cameraMatrix = BABYLON.Matrix.FromArray(matrix); //.invert();
            // const scaling = BABYLON.Vector3.Zero(),
            //   rotation = BABYLON.Vector3.Zero(),
            //   transform = BABYLON.Vector3.Zero();
            // cameraMatrix.decompose(scaling, rotation, transform);
            // const scaling2 = BABYLON.Vector3.Zero(),
            //   rotation2 = BABYLON.Vector3.Zero(),
            //   transform2 = BABYLON.Vector3.Zero();
            // worldMatrix.decompose(scaling2, rotation2, transform2);

            // const lng2 =
            //   props.origin[0] -
            //   this.map.getFreeCameraOptions().position.toLngLat().lng;
            // const lat2 =
            //   props.origin[1] -
            //   this.map.getFreeCameraOptions().position.toLngLat().lat;
            //
            // const pos = this.map.getFreeCameraOptions().position.toLngLat();
            // const orient = this.map.getFreeCameraOptions().orientation;

            // const camPos = latLng2Cartesian(
            //   this.map.getFreeCameraOptions().position.toLngLat(),
            //   this.map.getFreeCameraOptions().position.toAltitude(),
            // );
            // const orgPos = latLng2Cartesian({
            //   lng: props.origin[0],
            //   lat: props.origin[1],
            // });

            // const o = this.map.getFreeCameraOptions().orientation;
            // const orient = latLng2Cartesian(
            //   new window.MapLib.MercatorCoordinate(
            //     ...this.map.getFreeCameraOptions().orientation,
            //   ).toLngLat(),
            // );

            // console
            //   .log
            // this.map.getFreeCameraOptions().orientation,
            // this.map.getFreeCameraOptions().position.toLngLat(),
            //   orgX,
            //   camX,
            // camPos,
            // orgPos,
            // x,
            // this.scene.activeCamera.minZ,
            // this.scene.activeCamera.maxZ,
            // this.map.getFreeCameraOptions(),
            // this.map.getFreeCameraOptions().position.toAltitude(),
            // camPos.z,
            // orgPos.z,
            // camPos.z - orgPos.z,
            // this.scene.activeCamera.rotationQuaternion,
            // matrix,
            // camPos.z - orgPos.z,
            // camPos.x - orgPos.x,
            // camPos.y - orgPos.y,
            // camPos.z - orgPos.z,
            // this.index,
            // orient,
            // orient.x - orgPos.x,
            // new BABYLON.Vector3(...orient),
            // camY,
            // camZ,
            // pos.lng,
            // x2,
            // y2,
            // z2,
            // transform,
            // matrix,
            // cameraMatrix._m,
            // cameraMatrix,
            // new mapboxgl.MercatorCoordinate(
            //   transform.x,
            //   transform.y,
            //   transform.z,
            // ).toLngLat(),
            // worldOriginMercator.toLngLat(),
            // this.map.getFreeCameraOptions().position.toLngLat(),
            // this.map.getFreeCameraOptions().orientation,
            // BABYLON.Quaternion.FromArray(
            //   this.map.getFreeCameraOptions().orientation,
            // ),
            // this.scene.activeCamera.rotationQuaternion,
            // BABYLON.Vector3.FromArray(
            //   this.map.getFreeCameraOptions().orientation,
            // ),
            // ();
            // this.scene.activeCamera.freezeProjectionMatrix(
            //   props.disableProjectionMatrix
            //     ? BABYLON.Matrix.FromArray(matrix)
            //     : worldMatrix.multiply(BABYLON.Matrix.FromArray(matrix)),
            // );
            //
            // const { x, y } = this.map.project(
            //   new mapboxgl.MercatorCoordinate(pos.x, pos.y, pos.z).toLngLat(),
            // );
            // this.scene.activeCamera.position.y = 0; //-(camPos.x - orgPos.x);
            // this.scene.activeCamera.position.x = 0; //-(camPos.y - orgPos.y);
            // this.scene.activeCamera.position.z = -camPos.z; // - orgPos.z;
            // console.log(this.scene.activeCamera.position);

            // const [x, y, z, w] = this.map.getFreeCameraOptions().orientation;

            // let rotation_y = Math.atan(z / x);
            // if (x < 0) rotation_y += Math.PI;
            // rotation_y = Math.PI / 2 - rotation_y;
            // const rotation_x = Math.asin(-y);
            // const camera_up_before_rotatez = new BABYLON.Vector3(
            //   -Math.cos(rotation_y),
            //   0,
            //   Math.sin(rotation_y),
            // );
            // const rotation_z = Math.acos(
            //   camera_up.x * camera_up_before_rotatez.x +
            //     camera_up.y * camera_up_before_rotatez.y +
            //     camera_up.z * camera_up_before_rotatez.z,
            // );
            // rotation_z = Math.PI / 2 - rotation_z;
            // if (camera_up.y < 0) rotation_z = Math.PI - rotation_z;
            //
            // this.scene.activeCamera.rotation.x = rotation_x;
            // this.scene.activeCamera.rotation.y = rotation_y;

            // this.scene.activeCamera.rotationQuaternion =
            //   // BABYLON.Quaternion.Identity();
            //   // BABYLON.Quaternion.FromEulerAngles(1, 0, 0);
            //   BABYLON.Quaternion.FromArray([-x, y, -z, w]);
            // this.scene.activeCamera.alpha = -z;
            // this.scene.activeCamera.alpha = -z;
            // this.scene.activeCamera.radius = x; //Math.PI / 2 + this.index;
            // this.scene.activeCamera.radius = y;

            // this.index += 0.001;
            // BABYLON.Quaternion.RotationYawPitchRoll(-1, 1, -1);
            // BABYLON.Vector3.Zero();
            // BABYLON.Vector3.FromArray(
            //   this.map.getFreeCameraOptions().orientation,
            // );
            // this.scene.activeCamera.setTarget(
            //   BABYLON.Vector3.Zero(),
            //   // new BABYLON.Vector3(
            //   //   orient.x - orgPos.x,
            //   //   0, // orient.y - orgPos.y,
            //   //   0, // orient.z - orgPos.z,
            //   // ),
            // );
            // const o2 = this.map.project(
            //   new mapboxgl.MercatorCoordinate(
            //     orient[0],
            //     orient[1],
            //     orient[2],
            //   ).toLngLat(),
            // );
            // this.camera.setTarget(new BABYLON.Vector3(o2.x, o2.y, o2.z));
            // console.log(
            //   this.map.getCamera(),
            //   this.map.project(
            //     new mapboxgl.MercatorCoordinate(pos.x, pos.y, pos.z).toLngLat(),
            //   ),
            //   this.map.getFreeCameraOptions().orientation,
            // );
            // console.log(this.scene.activeCamera.position);
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
