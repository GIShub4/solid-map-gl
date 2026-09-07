import { render } from "solid-js/web";
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Layer } from "solid-map-gl";
import type { CustomLayerInterface } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Get a token at https://www.mapbox.com/studio/account/tokens/
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// `customLayer` takes a raw CustomLayerInterface (mapbox-gl-js's own WebGL
// escape hatch — the same interface deck.gl's overlays implement) instead
// of `style`. Adapted from mapbox-gl-js's own "Add a custom style layer"
// example: a single triangle drawn in a raw WebGL program.
const highlightLayer: CustomLayerInterface = {
  id: "highlight",
  type: "custom",
  onAdd(_map, gl) {
    const vertexSource = `
      uniform mat4 u_matrix;
      attribute vec2 a_pos;
      void main() {
        gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
      }`;
    const fragmentSource = `
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 0.5);
      }`;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);
    this.aPos = gl.getAttribLocation(this.program, "a_pos");

    // Helsinki, in Mercator coordinates, as expected by u_matrix.
    const helsinki = { x: 0.5598, y: 0.29 };
    const size = 0.005;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        helsinki.x - size, helsinki.y - size,
        helsinki.x + size, helsinki.y - size,
        helsinki.x, helsinki.y + size,
      ]),
      gl.STATIC_DRAW,
    );
  },
  render(gl, matrix) {
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(
      gl.getUniformLocation(this.program, "u_matrix"),
      false,
      matrix,
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.aPos);
    gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  },
} as CustomLayerInterface;

const App: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [24.9384, 60.1699],
    zoom: 10,
  } as Viewport);

  return (
    <MapGL
      options={{ accessToken: MAPBOX_ACCESS_TOKEN, style: "mb:dark" }}
      viewport={viewport()}
      onViewportChange={(evt: Viewport) => setViewport(evt)}
    >
      <Layer customLayer={highlightLayer} />
    </MapGL>
  );
};

render(() => <App />, document.getElementById("root")!);
