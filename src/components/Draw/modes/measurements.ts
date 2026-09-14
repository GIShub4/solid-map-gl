import { length, area, midpoint, centerOfMass } from "./geo";

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
    coordinates,
    window.navigator.language === "en-US" ? "miles" : "kilometers",
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
      coordinates: midpoint(coordinates[0], coordinates[1]),
    },
  };
};

export const getArea = (coordinates, meta?): any => {
  // area calculation in square meters
  const areaValue = area(coordinates);

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
    geometry: {
      type: "Point",
      coordinates: centerOfMass(coordinates),
    },
  };
};
