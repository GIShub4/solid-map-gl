// custom mapbopx-gl-draw mode that modifies draw_line_string
// shows a center point, radius line, and circle polygon while drawing
// forces draw.create on creation of second vertex

import length from "@turf/length";
import { getLength } from "./measurements";

function createVertex(parentId, coordinates, path, selected) {
  return {
    type: "Feature",
    properties: {
      meta: "vertex",
      parent: parentId,
      coord_path: path,
      active: selected ? "true" : "false",
    },
    geometry: {
      type: "Point",
      coordinates,
    },
  };
}

// create a circle-like polygon given a center point and radius
// https://stackoverflow.com/questions/37599561/drawing-a-circle-with-the-radius-in-miles-meters-with-mapbox-gl-js/39006388#39006388
function createGeoJSONCircle(
  center: number[],
  radius: number,
  parentId: number,
  points = 64,
) {
  const ret = [];
  const distanceX = radius / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const distanceY = radius / 110.574;

  for (let i = 0; i < points; i += 1) {
    let theta = (i / points) * (2 * Math.PI);
    let x = distanceX * Math.cos(theta);
    let y = distanceY * Math.sin(theta);
    ret.push([center[0] + x, center[1] + y]);
  }
  ret.push(ret[0]);

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [ret],
    },
    properties: {
      parent: parentId,
      active: "true",
    },
  };
}

const doubleClickZoom = {
  enable: (ctx) => {
    setTimeout(() => {
      // First check we've got a map and some context.
      if (
        !ctx.map ||
        !ctx.map.doubleClickZoom ||
        !ctx._ctx ||
        !ctx._ctx.store ||
        !ctx._ctx.store.getInitialConfigValue
      )
        return;
      // Now check initial state wasn't false (we leave it disabled if so)
      if (!ctx._ctx.store.getInitialConfigValue("doubleClickZoom")) return;
      ctx.map.doubleClickZoom.enable();
    }, 0);
  },
};

// takes the draw library passed to <Draw lib={...}> so this file has no
// static dependency on any specific @mapbox/mapbox-gl-draw install
const RadiusMode = (lib) => ({
  ...lib.modes.draw_line_string,

  clickAnywhere: function (state, e) {
    // this ends the drawing after the user creates a second point, triggering this.onStop
    if (state.currentVertexPosition === 1) {
      state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
      return this.changeMode("simple_select", { featureIds: [state.line.id] });
    }
    this.updateUIClasses({ mouse: "add" });
    state.line.updateCoordinate(
      state.currentVertexPosition,
      e.lngLat.lng,
      e.lngLat.lat,
    );
    if (state.direction === "forward") {
      state.currentVertexPosition += 1; // eslint-disable-line
      state.line.updateCoordinate(
        state.currentVertexPosition,
        e.lngLat.lng,
        e.lngLat.lat,
      );
    } else {
      state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
    }

    return null;
  },

  // creates the final geojson point feature with a radius property
  // triggers draw.create
  onStop: function (state) {
    doubleClickZoom.enable(this);

    this.activateUIButton();

    // check to see if we've deleted this feature
    if (this.getFeature(state.line.id) === undefined) return;

    // remove last added coordinate
    state.line.removeCoordinate("0");
    if (state.line.isValid()) {
      const lineGeoJson = state.line.toGeoJSON();
      const radius = (length(lineGeoJson) * 1000).toFixed(1);
      const center = lineGeoJson.geometry.coordinates[0];

      this.deleteFeature([state.line.id], { silent: true });

      const point = this.newFeature({
        type: "Feature",
        properties: { radius },
        geometry: {
          type: "Point",
          coordinates: center,
        },
      });
      this.addFeature(point);
      this.map.fire("draw.create", {
        features: [point.toGeoJSON()],
      });
      this.changeMode("simple_select", { featureIds: [point.id] });
    } else {
      this.deleteFeature([state.line.id], { silent: true });
      this.changeMode("simple_select", {}, { silent: true });
    }
  },

  toDisplayFeatures: function (state, geojson, display) {
    const isActiveLine = geojson.properties.id === state.line.id;
    geojson.properties.active = isActiveLine ? "true" : "false";
    if (!isActiveLine) return display(geojson);

    // Only render the line if it has at least one real coordinate
    if (geojson.geometry.coordinates.length < 2) return null;
    geojson.properties.meta = "feature";

    // displays center vertex as a point feature
    display(
      createVertex(
        state.line.id,
        geojson.geometry.coordinates[
          state.direction === "forward"
            ? geojson.geometry.coordinates.length - 2
            : 1
        ],
        `${state.direction === "forward" ? geojson.geometry.coordinates.length - 2 : 1}`,
        false,
      ),
    );
    // displays the line as it is drawn
    display(geojson);

    // display measurement
    display(getLength(geojson.geometry.coordinates, { parent: state.line.id }));

    // create custom feature for circle
    display(
      createGeoJSONCircle(
        geojson.geometry.coordinates[0],
        length(geojson),
        state.line.id,
      ),
    );

    return null;
  },
});

export default RadiusMode;
