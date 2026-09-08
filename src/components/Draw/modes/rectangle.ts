import { getArea, getLength } from "./measurements";

// takes the draw library passed to <Draw lib={...}> so this file has no
// static dependency on any specific @mapbox/mapbox-gl-draw install
const RectangleMode = (lib) => ({
  ...lib.modes.draw_line_string,

  // When the mode starts this function will be called.
  onSetup: function (opts) {
    const props = lib.modes.draw_line_string.onSetup.call(this, opts);

    const rectangle = this.newFeature({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[]],
      },
    });
    this.addFeature(rectangle);

    return { ...props, ...opts, rectangle };
  },
  // support mobile taps
  onTap: function (state, e) {
    // emulate 'move mouse' to update feature coords
    if (state.startPoint) this.onMouseMove(state, e);
    // emulate onClick
    this.onClick(state, e);
  },
  // Whenever a user clicks on the map, Draw will call `onClick`
  onClick: function (state, e) {
    if (
      state.startPoint &&
      state.startPoint[0] !== e.lngLat.lng &&
      state.startPoint[1] !== e.lngLat.lat
    ) {
      // if state.startPoint exist, means its second click
      // change to  simple_select mode
      this.updateUIClasses({ mouse: "pointer" });
      state.endPoint = [e.lngLat.lng, e.lngLat.lat];
      this.changeMode("simple_select", { featuresId: state.rectangle.id });
    } else {
      // if its first click, save clicked point coords as starting for  rectangle
      state.startPoint = [e.lngLat.lng, e.lngLat.lat];
    }
  },
  onMouseMove: function (state, e) {
    // if startPoint, update the feature coordinates, using the bounding box concept
    // we are simply using the startingPoint coordinates and the current Mouse Position
    // coordinates to calculate the bounding box on the fly, which will be our rectangle
    if (state.startPoint) {
      state.rectangle.updateCoordinate(
        "0.0",
        state.startPoint[0],
        state.startPoint[1],
      ); //minX, minY - the starting point
      state.rectangle.updateCoordinate(
        "0.1",
        e.lngLat.lng,
        state.startPoint[1],
      ); // maxX, minY
      state.rectangle.updateCoordinate("0.2", e.lngLat.lng, e.lngLat.lat); // maxX, maxY
      state.rectangle.updateCoordinate(
        "0.3",
        state.startPoint[0],
        e.lngLat.lat,
      ); // minX,maxY
      state.rectangle.updateCoordinate(
        "0.4",
        state.startPoint[0],
        state.startPoint[1],
      ); //minX,minY - ending point (equals to starting point)
    }
  },
  // Whenever a user clicks on a key while focused on the map, it will be sent here
  onKeyUp: function (state, e) {
    if (e.keyCode === 27) return this.changeMode("simple_select");
  },
  onStop: function (state) {
    lib.modes.draw_line_string.onStop.call(this, state);

    // check to see if we've deleted this feature
    if (this.getFeature(state.rectangle.id) === undefined) return;

    //remove last added coordinate
    state.rectangle.removeCoordinate("0.4");
    if (state.rectangle.isValid()) {
      this.map.fire("draw.create", {
        features: [state.rectangle.toGeoJSON()],
      });
    } else {
      this.deleteFeature([state.rectangle.id], { silent: true });
      this.changeMode("simple_select", {}, { silent: true });
    }
  },
  toDisplayFeatures: function (state, geojson, display) {
    const isActivePolygon = geojson.properties.id === state.rectangle.id;
    geojson.properties.active = isActivePolygon ? "true" : "false";
    if (!isActivePolygon) return display(geojson);

    // Only render the rectangular polygon if it has the starting point
    if (!state.startPoint) return;

    display(geojson);

    // create custom feature for the current pointer position
    if (this.drawConfig.userProperties.showLength) {
      display(
        getLength(
          [geojson.geometry.coordinates[0][0], geojson.geometry.coordinates[0][1]],
          { parent: state.rectangle.id, anchor: "bottom" },
        ),
      );
      display(
        getLength(
          [geojson.geometry.coordinates[0][1], geojson.geometry.coordinates[0][2]],
          { parent: state.rectangle.id, anchor: "left" },
        ),
      );
    }
    this.drawConfig.userProperties.showArea &&
      display(getArea(geojson.geometry.coordinates, { parent: state.rectangle.id }));
    return null;
  },
  onTrash: function (state) {
    this.deleteFeature([state.rectangle.id], { silent: true });
    this.changeMode("simple_select");
  },
});

export default RectangleMode;
