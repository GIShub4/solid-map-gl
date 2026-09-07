import { getLength, getArea } from "./measurements";

// takes the draw library passed to <Draw lib={...}> so this file has no
// static dependency on any specific @mapbox/mapbox-gl-draw install
export default (lib) => {
  const DrawPolygon = lib.modes.draw_polygon;

  return {
    ...DrawPolygon,
    toDisplayFeatures: function (state, geojson, display) {
      const displayMeasure = (geojson) => {
        display(geojson);

        if (this.drawConfig.userProperties.showLength) {
          const arr = Array.isArray(geojson.geometry.coordinates[0][0])
            ? geojson.geometry.coordinates[0]
            : geojson.geometry.coordinates;
          arr.forEach((coords, index) => {
            if (!Array.isArray(coords) || index == 0) return;
            display(getLength([arr[index - 1], coords]));
          });
        }

        this.drawConfig.userProperties.showArea &&
          geojson.geometry.coordinates[0].length >= 3 &&
          display(getArea([geojson.geometry.coordinates[0]]));
      };

      DrawPolygon.toDisplayFeatures.call(this, state, geojson, displayMeasure);
    },
  };
};
