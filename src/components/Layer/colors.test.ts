import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { resolveColor } from "./colors";

afterEach(() => {
  document.documentElement.style.removeProperty("--color-blue-600");
});

describe("resolveColor", () => {
  it("leaves hex/rgb/hsl/named CSS colors unchanged", () => {
    expect(resolveColor("#fff")).toBe("#fff");
    expect(resolveColor("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    expect(resolveColor("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)");
    expect(resolveColor("red")).toBe("red");
  });

  it("leaves an unset Tailwind name unchanged (no bundled fallback)", () => {
    expect(resolveColor("blue-600")).toBe("blue-600");
  });

  // jsdom's CSS engine accepts oklch() syntax but, unlike a real browser, doesn't perform actual
  // color-space conversion — `getComputedStyle(...).color` just echoes a normalized oklch() string
  // back rather than rgb(). These only assert that resolution is *attempted* (the value changes
  // from what was given); the resulting rgb() string can only be verified in a real browser, the
  // same jsdom limitation `docs/COMPONENTS.md`/`CLAUDE.md` already call out for WebGL.
  it("attempts to resolve a Tailwind name through its live --color-{name} custom property", () => {
    document.documentElement.style.setProperty(
      "--color-blue-600",
      "oklch(54.6% 0.245 262.881)",
    );
    expect(resolveColor("blue-600")).not.toBe("blue-600");
  });

  it("attempts to resolve a raw CSS Color 4 function value directly, without a Tailwind name", () => {
    const input = "oklch(54.6% 0.245 262.881)";
    expect(resolveColor(input)).not.toBe(input);
  });
});

describe("resolveColor bg-*/dark: class pair", () => {
  beforeAll(() => {
    // Stands in for what Tailwind's build would actually generate from a literal
    // "bg-blue-600 dark:bg-blue-400" match in a consuming app's source — a light rule plus a
    // class-strategy dark rule scoped under an ancestor `.dark`, mirroring Tailwind's own
    // `:where(.dark, .dark *)` convention closely enough to prove the cascade (not our own JS)
    // picks the winner.
    const style = document.createElement("style");
    style.textContent = `
      .bg-blue-600 { background-color: rgb(1, 2, 3); }
      .dark .dark\\:bg-blue-400 { background-color: rgb(4, 5, 6); }
    `;
    document.head.appendChild(style);
  });

  afterEach(() => {
    document.body.classList.remove("dark");
  });

  it("resolves the light class when no ancestor has the dark class", () => {
    expect(resolveColor("bg-blue-600 dark:bg-blue-400")).toBe("rgb(1, 2, 3)");
  });

  it("resolves the dark class once an ancestor has the dark class — the cascade decides, not us", () => {
    document.body.classList.add("dark");
    expect(resolveColor("bg-blue-600 dark:bg-blue-400")).toBe("rgb(4, 5, 6)");
  });

  it("accepts a bare bg-name with no dark variant at all", () => {
    expect(resolveColor("bg-blue-600")).toBe("rgb(1, 2, 3)");
  });

  it("leaves the literal string unchanged when the classes were never generated", () => {
    const input = "bg-emerald-500 dark:bg-emerald-300";
    expect(resolveColor(input)).toBe(input);
  });
});
