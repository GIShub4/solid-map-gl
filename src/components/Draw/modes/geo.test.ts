import { describe, it, expect } from "vitest";
import { length, midpoint, area, centerOfMass } from "./geo";

describe("length", () => {
  it("matches the known great-circle distance between two well-known cities", () => {
    // London -> Paris, ~343.5 km great-circle distance
    const km = length([
      [-0.1276, 51.5072],
      [2.3522, 48.8566],
    ]);
    expect(km).toBeCloseTo(343.5, 0);
  });

  it("converts to miles", () => {
    const km = length([
      [-0.1276, 51.5072],
      [2.3522, 48.8566],
    ]);
    const miles = length(
      [
        [-0.1276, 51.5072],
        [2.3522, 48.8566],
      ],
      "miles",
    );
    expect(miles).toBeCloseTo(km / 1.609344, 6);
  });

  it("sums distance across multiple segments", () => {
    const oneSegment = length([
      [0, 0],
      [1, 0],
    ]);
    const twoSegments = length([
      [0, 0],
      [0.5, 0],
      [1, 0],
    ]);
    expect(twoSegments).toBeCloseTo(oneSegment, 6);
  });

  it("returns 0 for a single point", () => {
    expect(length([[0, 0]])).toBe(0);
  });
});

describe("midpoint", () => {
  it("is symmetric and falls between the two points", () => {
    const from: [number, number] = [-0.1276, 51.5072];
    const to: [number, number] = [2.3522, 48.8566];
    const [lng, lat] = midpoint(from, to);

    expect(lng).toBeGreaterThan(from[0]);
    expect(lng).toBeLessThan(to[0]);
    expect(lat).toBeLessThan(from[1]);
    expect(lat).toBeGreaterThan(to[1]);

    const reversed = midpoint(to, from);
    expect(reversed[0]).toBeCloseTo(lng, 6);
    expect(reversed[1]).toBeCloseTo(lat, 6);
  });

  it("returns the same point when both inputs are equal", () => {
    const point: [number, number] = [10, 20];
    const [lng, lat] = midpoint(point, point);
    expect(lng).toBeCloseTo(10, 6);
    expect(lat).toBeCloseTo(20, 6);
  });
});

describe("area", () => {
  it("computes ~0 for a degenerate (zero-width) polygon", () => {
    const sliver = area([
      [
        [0, 0],
        [1, 0],
        [0, 0],
        [0, 0],
      ],
    ]);
    expect(sliver).toBeCloseTo(0, 6);
  });

  it("matches a known reference value for a roughly 1km x 1km square near the equator", () => {
    // ~0.009 degrees is close to 1km at the equator in both directions
    const squareArea = area([
      [
        [0, 0],
        [0.009, 0],
        [0.009, 0.009],
        [0, 0.009],
        [0, 0],
      ],
    ]);
    expect(squareArea).toBeGreaterThan(900_000);
    expect(squareArea).toBeLessThan(1_100_000);
  });

  it("subtracts hole rings from the outer ring", () => {
    const outer = [
      [0, 0],
      [0.01, 0],
      [0.01, 0.01],
      [0, 0.01],
      [0, 0],
    ];
    const hole = [
      [0.002, 0.002],
      [0.008, 0.002],
      [0.008, 0.008],
      [0.002, 0.008],
      [0.002, 0.002],
    ];
    const withHole = area([outer, hole]);
    const withoutHole = area([outer]);
    expect(withHole).toBeLessThan(withoutHole);
    expect(withHole).toBeGreaterThan(0);
  });
});

describe("centerOfMass", () => {
  it("returns the exact center of a symmetric square", () => {
    const [x, y] = centerOfMass([
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
    ]);
    expect(x).toBeCloseTo(5, 6);
    expect(y).toBeCloseTo(5, 6);
  });

  it("weights toward the wider end of an asymmetric polygon rather than the plain vertex average", () => {
    // a wide trapezoid: much wider at y=0 than at y=10, so the area-weighted
    // centroid should sit below the plain average of the four vertices
    const ring: [number, number][] = [
      [-10, 0],
      [10, 0],
      [1, 10],
      [-1, 10],
      [-10, 0],
    ];
    const [, y] = centerOfMass([ring]);
    const vertexAverageY =
      ring.slice(0, -1).reduce((sum, [, py]) => sum + py, 0) /
      (ring.length - 1);
    expect(y).toBeLessThan(vertexAverageY);
  });

  it("falls back to the vertex mean for a degenerate (zero-area) ring", () => {
    const [x, y] = centerOfMass([
      [
        [0, 0],
        [4, 0],
        [0, 0],
      ],
    ]);
    expect(x).toBeCloseTo((0 + 4 + 0) / 3, 6);
    expect(y).toBeCloseTo(0, 6);
  });
});
