// Standalone replacements for the handful of @turf/* functions Draw's
// measurement/radius modes used, so this package doesn't carry 5 npm
// dependencies (with their own transitive deps and version-bump churn) for
// four small geodesic formulas. Each one is a well-known standalone formula
// (see comments), not a partial reimplementation of Turf.

export type Position = [number, number]; // [lng, lat]

// mean earth radius in km, matching @turf/helpers' `earthRadius` (used for
// distance/length so results line up with the values Draw showed before)
const EARTH_RADIUS_KM = 6371.0088;
const KM_PER_MILE = 1.609344;

// WGS84 equatorial radius in meters, matching @turf/area's `RADIUS` constant
const EARTH_RADIUS_M = 6378137;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

// haversine great-circle distance between two points, in kilometers
function distance(from: Position, to: Position): number {
  const dLat = toRadians(to[1] - from[1]);
  const dLng = toRadians(to[0] - from[0]);
  const lat1 = toRadians(from[1]);
  const lat2 = toRadians(to[1]);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(a));
}

// total great-circle length of a line, summing haversine distance segment by segment
export function length(
  coordinates: Position[],
  units: "miles" | "kilometers" = "kilometers",
): number {
  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    total += distance(coordinates[i - 1], coordinates[i]);
  }
  return units === "miles" ? total / KM_PER_MILE : total;
}

// great-circle midpoint between two points (the "Bx, By" midpoint formula,
// see https://www.movable-type.co.uk/scripts/latlong.html#midpoint)
export function midpoint(from: Position, to: Position): Position {
  const lat1 = toRadians(from[1]);
  const lon1 = toRadians(from[0]);
  const lat2 = toRadians(to[1]);
  const dLon = toRadians(to[0] - from[0]);

  const bx = Math.cos(lat2) * Math.cos(dLon);
  const by = Math.cos(lat2) * Math.sin(dLon);

  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) ** 2 + by ** 2),
  );
  const lon3 = lon1 + Math.atan2(by, Math.cos(lat1) + bx);

  return [toDegrees(lon3), toDegrees(lat3)];
}

// spherical excess area of a single ring (Chamberlain & Duquette's
// algorithm, the same one @turf/area uses), in square meters
function ringArea(ring: Position[]): number {
  const n = ring.length;
  if (n <= 2) return 0;

  let total = 0;
  for (let i = 0; i < n; i++) {
    let lower: number;
    let middle: number;
    let upper: number;
    if (i === n - 2) {
      lower = n - 2;
      middle = n - 1;
      upper = 0;
    } else if (i === n - 1) {
      lower = n - 1;
      middle = 0;
      upper = 1;
    } else {
      lower = i;
      middle = i + 1;
      upper = i + 2;
    }
    total +=
      (toRadians(ring[upper][0]) - toRadians(ring[lower][0])) *
      Math.sin(toRadians(ring[middle][1]));
  }

  return (total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2;
}

// polygon area in square meters; rings after the first are holes, subtracted from the total
export function area(rings: Position[][]): number {
  return rings.reduce((total, ring, i) => {
    const ringTotal = Math.abs(ringArea(ring));
    return i === 0 ? total + ringTotal : total - ringTotal;
  }, 0);
}

// area-weighted polygon centroid ("center of mass"): triangulate the ring
// from its arithmetic-mean vertex and average the triangle centroids
// weighted by (signed, planar) triangle area. Coordinates are translated to
// be relative to that mean vertex first purely for floating-point precision
// (matches @turf/center-of-mass), then translated back at the end.
export function centerOfMass(rings: Position[][]): Position {
  const ring = rings[0];

  let meanX = 0;
  let meanY = 0;
  for (const [x, y] of ring) {
    meanX += x;
    meanY += y;
  }
  meanX /= ring.length;
  meanY /= ring.length;

  let xSum = 0;
  let ySum = 0;
  let areaSum = 0;

  for (let i = 0; i < ring.length - 1; i++) {
    const x1 = ring[i][0] - meanX;
    const y1 = ring[i][1] - meanY;
    const x2 = ring[i + 1][0] - meanX;
    const y2 = ring[i + 1][1] - meanY;
    const cross = x1 * y2 - x2 * y1;

    xSum += (x1 + x2) * cross;
    ySum += (y1 + y2) * cross;
    areaSum += cross;
  }

  if (areaSum === 0) return [meanX, meanY];

  const factor = 1 / (3 * areaSum);
  return [meanX + xSum * factor, meanY + ySum * factor];
}
