import { getCoords } from "./measurements";

// takes the draw library passed to <Draw lib={...}> so this file has no
// static dependency on any specific @mapbox/mapbox-gl-draw install
export default (lib) => {
  const DrawPoint = lib.modes.draw_point;

  return {
    ...DrawPoint,
    onSetup: function () {
      const draw = DrawPoint.onSetup.call(this);
      draw.point.properties = {
        ...draw.point.properties,
        type: "measure",
        anchor: "bottom",
      };

      return draw;
    },
    onMouseMove: function (state, { lngLat }) {
      state.point.properties.value = getCoords([lngLat.lng, lngLat.lat]);
      state.point.updateCoordinate("", lngLat.lng, lngLat.lat);
    },
    toDisplayFeatures: function (state, geojson, display) {
      const isActivePoint = geojson.properties.id === state.point.id;
      geojson.properties.active = isActivePoint ? "" : "false";
      return display(geojson);
    },
  };
};
