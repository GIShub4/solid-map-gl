import { describe, it, expect, afterEach } from "vitest";
import { getCoords, getLength, getArea } from "./measurements";

const stubLanguage = (language: string) => {
  const original = Object.getOwnPropertyDescriptor(window.navigator, "language");
  Object.defineProperty(window.navigator, "language", {
    value: language,
    configurable: true,
  });
  return () => {
    if (original) Object.defineProperty(window.navigator, "language", original);
  };
};

describe("getCoords", () => {
  it("formats a [lng, lat] pair as a degree-suffixed string", () => {
    expect(getCoords([2.3522, 48.8566])).toBe("2.3522° 48.8566°");
  });

  it("rounds to at most 5 fraction digits", () => {
    expect(getCoords([2.123456789, 48.987654321])).toBe("2.12346° 48.98765°");
  });
});

describe("getLength", () => {
  let restore: () => void;
  afterEach(() => restore?.());

  it("labels a short line in feet under the en-US locale", () => {
    restore = stubLanguage("en-US");
    // ~90m apart, well under the 1-mile threshold
    const feature = getLength([
      [0, 0],
      [0, 0.0008],
    ]);
    expect(feature.type).toBe("Feature");
    expect(feature.properties.type).toBe("measure");
    expect(feature.properties.value).toContain("ft");
    expect(feature.geometry.type).toBe("Point");
  });

  it("labels a long line in miles under the en-US locale", () => {
    restore = stubLanguage("en-US");
    const feature = getLength([
      [-0.1276, 51.5072],
      [2.3522, 48.8566],
    ]);
    expect(feature.properties.value).toContain("mi");
  });

  it("labels a short line in meters under a non-en-US locale", () => {
    restore = stubLanguage("de-DE");
    const feature = getLength([
      [0, 0],
      [0, 0.0008],
    ]);
    expect(feature.properties.value).toMatch(/m$/);
  });

  it("labels a long line in kilometers under a non-en-US locale", () => {
    restore = stubLanguage("de-DE");
    const feature = getLength([
      [-0.1276, 51.5072],
      [2.3522, 48.8566],
    ]);
    expect(feature.properties.value).toContain("km");
  });

  it("places the label at the midpoint and merges extra metadata", () => {
    restore = stubLanguage("en-US");
    const from: [number, number] = [-0.1276, 51.5072];
    const to: [number, number] = [2.3522, 48.8566];
    const feature = getLength([from, to], { parent: "line1" });
    expect(feature.properties.parent).toBe("line1");
    expect(feature.geometry.coordinates[0]).toBeGreaterThan(from[0]);
    expect(feature.geometry.coordinates[0]).toBeLessThan(to[0]);
  });
});

describe("getArea", () => {
  let restore: () => void;
  afterEach(() => restore?.());

  const tinySquare = [
    [
      [0, 0],
      [0.00002, 0],
      [0.00002, 0.00002],
      [0, 0.00002],
      [0, 0],
    ],
  ];

  const bigSquare = [
    [
      [0, 0],
      [0.5, 0],
      [0.5, 0.5],
      [0, 0.5],
      [0, 0],
    ],
  ];

  it("labels a tiny polygon in square feet under the en-US locale", () => {
    restore = stubLanguage("en-US");
    const feature = getArea(tinySquare);
    expect(feature.properties.value).toContain("ft");
    expect(feature.properties.value.endsWith("²")).toBe(true);
  });

  it("labels a large polygon in square miles under the en-US locale", () => {
    restore = stubLanguage("en-US");
    const feature = getArea(bigSquare);
    expect(feature.properties.value).toContain("mi");
  });

  it("labels a tiny polygon in square meters under a non-en-US locale", () => {
    restore = stubLanguage("de-DE");
    const feature = getArea(tinySquare);
    expect(feature.properties.value).toContain("m²");
  });

  it("labels a large polygon in square kilometers under a non-en-US locale", () => {
    restore = stubLanguage("de-DE");
    const feature = getArea(bigSquare);
    expect(feature.properties.value).toContain("km");
  });

  it("places the label at the polygon's center of mass and merges extra metadata", () => {
    restore = stubLanguage("en-US");
    const feature = getArea(bigSquare, { parent: "poly1" });
    expect(feature.properties.parent).toBe("poly1");
    expect(feature.geometry.type).toBe("Point");
    expect(feature.geometry.coordinates[0]).toBeCloseTo(0.25, 6);
    expect(feature.geometry.coordinates[1]).toBeCloseTo(0.25, 6);
  });
});
