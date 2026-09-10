import { describe, it, expect } from "vitest";
import { renderToStringAsync, isServer } from "solid-js/web";
import MapGL from "../..";

// Runs under the "ssr" vitest project (vite.config.ts), which resolves solid-js/solid-js-web
// through their real "node" export condition and compiles JSX with vite-plugin-solid's
// `ssr: true` option — unlike every other test file in this repo, there is no jsdom here at all,
// so this is the only place that actually proves MapGL survives a real server render rather than
// one that happens to have `window`/`document` available via jsdom.
describe("MapGL (SSR)", () => {
  it("runs in a genuine server environment with no DOM", () => {
    expect(isServer).toBe(true);
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
  });

  it("renders the container div without throwing and mounts nothing else", async () => {
    const html = await renderToStringAsync(() => (
      <MapGL
        id="map"
        style={{ width: "500px" }}
        options={{ accessToken: "token" }}
      />
    ));

    expect(html).toContain('id="map"');
    // mapLoaded() only ever flips from its initial `null` inside onMount's map.once("load")
    // callback, and onMount never runs during SSR — so MapProvider and everything nested under
    // it (Source, Layer, Marker, ...) must never appear in server output.
    expect(html).not.toContain("overlay");
  });
});
