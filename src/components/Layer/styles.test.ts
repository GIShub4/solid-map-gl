import { describe, it, expect } from "vitest";
import { baseStyle, layoutStyles } from "./styles";

describe("baseStyle", () => {
  it("lists the non-paint/layout Layer keys used by Layer's updateStyle() bucketing", () => {
    expect(baseStyle).toEqual(
      expect.arrayContaining([
        "id",
        "type",
        "filter",
        "source",
        "source-layer",
        "minzoom",
        "maxzoom",
        "paint",
        "layout",
      ]),
    );
  });

  it("does not include any paint/layout property names", () => {
    layoutStyles.forEach((key) => expect(baseStyle).not.toContain(key));
  });
});

describe("layoutStyles", () => {
  it("contains representative layout-only properties Layer must bucket into `layout`", () => {
    expect(layoutStyles).toEqual(
      expect.arrayContaining([
        "visibility",
        "line-join",
        "icon-image",
        "text-field",
        "symbol-placement",
      ]),
    );
  });

  it("has no duplicate entries", () => {
    expect(new Set(layoutStyles).size).toBe(layoutStyles.length);
  });
});
