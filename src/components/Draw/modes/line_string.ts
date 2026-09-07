import { getLength } from "./measurements";

// takes the draw library passed to <Draw lib={...}> so this file has no
// static dependency on any specific @mapbox/mapbox-gl-draw install
export default (lib) => {
  const DrawLineString = lib.modes.draw_line_string;

  return {
    ...DrawLineString,
    onSetup: function () {
      const draw = DrawLineString.onSetup.call(this);
      const measure = this.newFeature({
        type: "Feature",
        properties: {
          type: "measure",
          value: "TTT",
        },
        geometry: {
          type: "Point",
          coordinates: [],
        },
      });

      return { ...draw, measure };
    },
    onMouseMove: function (state, e) {
      DrawLineString.onMouseMove.call(this, state, e);

      if (state.line.coordinates.length >= 2) {
        const measure = getLength(state.line.coordinates);
        state.measure.properties.value = measure.properties.value;
        state.measure.updateCoordinate(
          "",
          measure.geometry.coordinates[0],
          measure.geometry.coordinates[1],
        );
      }
    },
    toDisplayFeatures: function (state, geojson, display) {
      DrawLineString.toDisplayFeatures.call(this, state, geojson, display);
      if (this.drawConfig.userProperties.showLength) {
        display(state.measure.toGeoJSON());
      }
    },
  };
};
