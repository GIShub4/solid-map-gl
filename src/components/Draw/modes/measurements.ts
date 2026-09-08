import length from "@turf/length";
import area from "@turf/area";
import midpoint from "@turf/midpoint";
import { centerOfMass } from "@turf/center-of-mass";

export const getCoords = (coords) => {
  return (
    new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 5,
    }).format(coords[0]) +
    "° " +
    new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 5,
    }).format(coords[1]) +
    "°"
  );
};

// Explicit `any` return types avoid TS2742 ("inferred type cannot be named
// without a reference to .pnpm/@types+geojson/...") — these functions are
// module-private (never exported from src/index.tsx), so a precise GeoJSON
// return type isn't worth pulling `geojson` in as a direct dependency for.
export const getLength = (coordinates, meta?): any => {
  // length calculation in kilometers or miles
  const lengthValue = length(
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates,
      },
    },
    {
      units: window.navigator.language === "en-US" ? "miles" : "kilometers",
    },
  );

  const label =
    window.navigator.language === "en-US"
      ? new Intl.NumberFormat(undefined, {
          style: "unit",
          maximumFractionDigits: 2,
          unit: lengthValue <= 1 ? "foot" : "mile",
        }).format(lengthValue <= 1 ? lengthValue * 5280 : lengthValue)
      : new Intl.NumberFormat(undefined, {
          style: "unit",
          maximumFractionDigits: 2,
          unit: lengthValue <= 1 ? "meter" : "kilometer",
        }).format(lengthValue <= 1 ? lengthValue * 1000 : lengthValue);

  return {
    type: "Feature",
    properties: {
      type: "measure",
      value: label,
      ...meta,
    },
    geometry: {
      type: "Point",
      coordinates: midpoint(coordinates[0], coordinates[1]).geometry
        .coordinates,
    },
  };
};

export const getArea = (coordinates, meta?): any => {
  // area calculation in square meters
  const areaValue = area({
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates,
    },
  });

  const areaLabel =
    window.navigator.language === "en-US"
      ? new Intl.NumberFormat(undefined, {
          style: "unit",
          maximumFractionDigits: 2,
          unit: areaValue <= 10.764 ? "foot" : "mile",
        }).format(
          areaValue <= 10.764 ? areaValue * 10.764 : areaValue * 1.0000003861,
        ) + "²"
      : new Intl.NumberFormat(undefined, {
          style: "unit",
          maximumFractionDigits: 2,
          unit: areaValue <= 1000000 ? "meter" : "kilometer",
        }).format(areaValue <= 1000000 ? areaValue : areaValue / 1000000) + "²";

  return {
    type: "Feature",
    properties: {
      type: "measure",
      value: areaLabel,
      ...meta,
    },
    geometry: centerOfMass({
      type: "Polygon",
      coordinates,
    }).geometry,
  };
};
