import { describe, it, expect } from "vitest";
import { toSDF, sdfPadding } from "./sdf";

function makeSquare(size: number, inset: number) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inside = x >= inset && x < size - inset && y >= inset && y < size - inset;
      const i = (y * size + x) * 4;
      data[i + 3] = inside ? 255 : 0;
    }
  }
  return { width: size, height: size, data };
}

describe("toSDF", () => {
  it("encodes a smooth distance gradient rather than passing through a binary mask", () => {
    const src = makeSquare(40, 10);
    const out = toSDF(src, { radius: 8, cutoff: 0.25 });
    const alphaAt = (x: number, y: number) => out.data[(y * out.width + x) * 4 + 3];

    expect(out.width).toBe(40);
    expect(out.height).toBe(40);
    expect(alphaAt(20, 20)).toBeGreaterThan(200); // deep inside the shape
    expect(alphaAt(1, 1)).toBeLessThan(30); // far outside the shape
    expect(alphaAt(10, 20)).toBeGreaterThan(alphaAt(1, 1)); // original boundary sits between
    expect(alphaAt(10, 20)).toBeLessThan(alphaAt(20, 20));

    const distinctValues = new Set<number>();
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) distinctValues.add(alphaAt(x, y));
    expect(distinctValues.size).toBeGreaterThan(10);
  });

  it("writes opaque white into rgb, leaving color entirely to the map's paint properties", () => {
    const out = toSDF(makeSquare(10, 2));
    for (let i = 0; i < out.data.length; i += 4) {
      expect([out.data[i], out.data[i + 1], out.data[i + 2]]).toEqual([255, 255, 255]);
    }
  });

  it("preserves dimensions for a fully-transparent input", () => {
    const empty = { width: 5, height: 5, data: new Uint8ClampedArray(5 * 5 * 4) };
    const out = toSDF(empty);
    expect(out.width).toBe(5);
    expect(out.height).toBe(5);
    expect(out.data.length).toBe(5 * 5 * 4);
  });
});

describe("sdfPadding", () => {
  it("defaults to the default radius", () => {
    expect(sdfPadding()).toBe(8);
  });

  it("rounds a custom radius up to whole pixels", () => {
    expect(sdfPadding({ radius: 3.2 })).toBe(4);
  });
});
