import { describe, it, expect } from "vitest";
import { mapEvents, layerEvents, drawEvents } from "./events";

describe("mapEvents", () => {
  it("has no duplicate entries", () => {
    expect(new Set(mapEvents).size).toBe(mapEvents.length);
  });

  it("every entry follows the onXxx prop-name convention", () => {
    mapEvents.forEach((name) => expect(name).toMatch(/^on[A-Z]/));
  });
});

describe("layerEvents", () => {
  it("is a subset of mapEvents (every per-layer event is also a map-level event)", () => {
    layerEvents.forEach((name) => expect(mapEvents).toContain(name));
  });
});

describe("drawEvents", () => {
  it("has no duplicate entries", () => {
    expect(new Set(drawEvents).size).toBe(drawEvents.length);
  });

  it("every entry follows the onXxx prop-name convention", () => {
    drawEvents.forEach((name) => expect(name).toMatch(/^on[A-Z]/));
  });
});
