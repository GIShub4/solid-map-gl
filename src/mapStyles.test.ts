import { describe, it, expect } from "vitest";
import { vectorStyleList, rasterStyleList } from "./mapStyles";

// Mirrors MapGL's getStyle()/Source's lookup() shorthand resolution:
// url.split(':').reduce((p, c) => p && p[c], list)
const resolve = (list: any, shorthand: string) =>
  shorthand.split(":").reduce((p, c) => p && p[c], list);

describe("vectorStyleList", () => {
  it("resolves a known mb:* shorthand to a style URL", () => {
    expect(resolve(vectorStyleList, "mb:light")).toBe(
      "mapbox://styles/mapbox/light-v11",
    );
  });

  it("resolves a known here:* shorthand containing the {apikey} placeholder", () => {
    expect(resolve(vectorStyleList, "here:day")).toContain("{apikey}");
  });

  it("returns undefined for an unknown prefix", () => {
    expect(resolve(vectorStyleList, "nope:light")).toBeUndefined();
  });
});

describe("rasterStyleList", () => {
  it("resolves a known osm:* shorthand to a tile URL template", () => {
    expect(resolve(rasterStyleList, "osm:org")).toBe(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    );
  });

  it("carries an attribution string alongside each provider's tile templates", () => {
    expect(rasterStyleList["carto"]._copy).toContain("Carto");
  });

  it("tf:* templates carry the {apikey} placeholder", () => {
    expect(resolve(rasterStyleList, "tf:cycle")).toContain("{apikey}");
  });
});
