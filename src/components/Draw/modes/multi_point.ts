const MultiPointMode: any = {};

// When the mode starts this function will be called.
// The `opts` argument comes from `draw.changeMode('lotsofpoints', {count:7})`.
// The value returned should be an object and will be passed to all other lifecycle functions
MultiPointMode.onSetup = function (opts) {
  var state: any = {};
  state.count = opts.count || 0;
  return state;
};

// Whenever a user clicks on the map, Draw will call `onClick`
MultiPointMode.onClick = function (state, e) {
  // `this.newFeature` takes geojson and makes a DrawFeature
  var point = this.newFeature({
    type: "Feature",
    properties: {
      count: state.count,
    },
    geometry: {
      type: "Point",
      coordinates: [e.lngLat.lng, e.lngLat.lat],
    },
  });
  this.addFeature(point); // puts the point on the map
};

// Whenever a user clicks on a key while focused on the map, it will be sent here
MultiPointMode.onKeyUp = function (state, e) {
  if (e.keyCode === 27) return this.changeMode("simple_select");
};

// This is the only required function for a mode.
// It decides which features currently in Draw's data store will be rendered on the map.
// All features passed to `display` will be rendered, so you can pass multiple display features per internal feature.
// See `styling-draw` in `API.md` for advice on making display features
MultiPointMode.toDisplayFeatures = function (state, geojson, display) {
  display(geojson);
};

export default MultiPointMode;
