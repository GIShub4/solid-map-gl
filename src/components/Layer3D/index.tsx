import { onCleanup, VoidComponent, createUniqueId, onMount } from 'solid-js'
import { useMapContext } from '../MapProvider'

declare global {
  interface Window {
    BABYLON?: any
    THREE?: any
  }
}

type Props = {
  id?: string
  origin?: [number, number, number?] // [lng, lat, altitude]
  defaultLight?: boolean
  babylon?: boolean
  onAdd?: (scene: any, camera: any, map: any, gl: any) => void
  onRender?: (gl: any, matrix: any) => void
}
export const Layer3D: VoidComponent<Props> = (props) => {
  const [ctx] = useMapContext()

  onMount(async () => {
    props.id = props.id || createUniqueId()

    const worldOriginMercator = window.MapLib.MercatorCoordinate.fromLngLat(
      props.origin ? [props.origin[0], props.origin[1]] : [0, 0],
      props.origin ? props.origin[2] : 0
    )
    const worldScale = worldOriginMercator.meterInMercatorCoordinateUnits()

    let worldMatrix = null
    let BABYLON = null
    let THREE = null

    if (props.babylon) {
      //@ts-ignore
      BABYLON = await import('@babylonjs/core')
      worldMatrix = BABYLON.Matrix.Compose(
        new BABYLON.Vector3(worldScale, worldScale, worldScale),
        BABYLON.Quaternion.FromEulerAngles(Math.PI / 2, 0, 0),
        new BABYLON.Vector3(
          worldOriginMercator.x,
          worldOriginMercator.y,
          worldOriginMercator.z
        )
      )
    } else {
      //@ts-ignore
      THREE = await import('three')
      worldMatrix = {
        translateX: worldOriginMercator.x,
        translateY: worldOriginMercator.y,
        translateZ: worldOriginMercator.z,
        rotateX: Math.PI / 2,
        rotateY: 0,
        rotateZ: 0,
        scale: worldScale,
      }
    }

    ctx.map.addLayer({
      id: props.id,
      type: 'custom',
      renderingMode: '3d',
      onAdd(map, gl) {
        if (props.babylon) {
          const engine = new BABYLON.Engine(
            gl,
            true,
            {
              useHighPrecisionMatrix: true,
            },
            true
          )
          this.scene = new BABYLON.Scene(engine)
          this.scene.autoClear = false
          this.scene.detachControl()
          this.scene.beforeRender = () => engine.wipeCaches(true)
          this.camera = new BABYLON.Camera(
            'Camera',
            new BABYLON.Vector3(0, 0, 0),
            this.scene
          )
          this.light = new BABYLON.HemisphericLight(
            'Light',
            new BABYLON.Vector3(0, 100, -100),
            this.scene
          )
          this.light.setEnabled(props.defaultLight)
        } else {
          this.camera = new THREE.Camera()
          this.scene = new THREE.Scene()
          if (props.defaultLight) {
            this.light = new THREE.DirectionalLight(0xffffff)
            this.light.position.set(0, 100, 100).normalize()
            this.scene.add(this.light)
          }

          this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true,
          })
          this.renderer.autoClear = false
        }
        props.onAdd && props.onAdd(this.scene, this.camera, map, gl)
      },
      render(gl, matrix) {
        if (props.babylon) {
          const cameraMatrix = BABYLON.Matrix.FromArray(matrix)
          const wvpMatrix = worldMatrix.multiply(cameraMatrix)

          this.camera.freezeProjectionMatrix(wvpMatrix)
          this.scene.render(false)
        } else {
          const rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0),
            worldMatrix.rotateX
          )
          const rotationY = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 1, 0),
            worldMatrix.rotateY
          )
          const rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1),
            worldMatrix.rotateZ
          )

          const m = new THREE.Matrix4().fromArray(matrix)
          const l = new THREE.Matrix4()
            .makeTranslation(
              worldMatrix.translateX,
              worldMatrix.translateY,
              worldMatrix.translateZ
            )
            .scale(
              new THREE.Vector3(
                worldMatrix.scale,
                -worldMatrix.scale,
                worldMatrix.scale
              )
            )
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ)
          this.camera.projectionMatrix = m.multiply(l)
          this.renderer.resetState()
          this.renderer.render(this.scene, this.camera)
        }
        props.onRender && props.onRender(gl, matrix)
        ctx.map.triggerRepaint()
      },
    })
  })

  onCleanup(() => {
    ctx.map.getLayer(props.id) && ctx.map.removeLayer(props.id)
  })

  return null
}
