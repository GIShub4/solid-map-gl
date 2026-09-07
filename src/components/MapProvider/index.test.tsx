import { describe, it, expect } from "vitest";
import { render } from "@solidjs/testing-library";
import { unwrap } from "solid-js/store";
import { MapProvider, useMapContext } from "./index";
import { createMockMap, createMockMapLib } from "../../testUtils/mockMap";

const Probe = (props: { onCtx: (ctx: any) => void }) => {
  const [ctx] = useMapContext();
  props.onCtx(ctx);
  return null;
};

describe("MapProvider", () => {
  it("exposes the map passed via props on context", () => {
    const map = createMockMap();
    let seen: any;
    render(() => (
      <MapProvider map={map}>
        <Probe onCtx={(ctx) => (seen = ctx)} />
      </MapProvider>
    ));
    expect(unwrap(seen.map)).toBe(map);
  });

  it("exposes mapLib and isMapLibre on context", () => {
    const map = createMockMap({ isMapLibre: true });
    const mapLib = createMockMapLib({ isMapLibre: true });
    let seen: any;
    render(() => (
      <MapProvider map={map} mapLib={mapLib} isMapLibre={true}>
        <Probe onCtx={(ctx) => (seen = ctx)} />
      </MapProvider>
    ));
    expect(unwrap(seen.mapLib)).toBe(mapLib);
    expect(seen.isMapLibre).toBe(true);
  });

  it("defaults isMapLibre to false and mapLib to null when not provided", () => {
    const map = createMockMap();
    let seen: any;
    render(() => (
      <MapProvider map={map}>
        <Probe onCtx={(ctx) => (seen = ctx)} />
      </MapProvider>
    ));
    expect(seen.isMapLibre).toBe(false);
    expect(seen.mapLib).toBe(null);
  });

  it("gives each MapProvider instance its own isolated context (no cross-map collisions)", () => {
    const mapA = createMockMap();
    const mapB = createMockMap();
    let seenA: any;
    let seenB: any;
    render(() => (
      <>
        <MapProvider map={mapA}>
          <Probe onCtx={(ctx) => (seenA = ctx)} />
        </MapProvider>
        <MapProvider map={mapB}>
          <Probe onCtx={(ctx) => (seenB = ctx)} />
        </MapProvider>
      </>
    ));
    expect(unwrap(seenA.map)).toBe(mapA);
    expect(unwrap(seenB.map)).toBe(mapB);
    expect(seenA.map).not.toBe(seenB.map);
  });
});
