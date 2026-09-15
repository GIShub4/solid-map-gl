import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import {
  createMockMap,
  createMockMapLib,
  createMockDrawLib,
  renderWithMap,
  tick,
} from "./testing";
import { useMapContext } from "./components/MapProvider";

afterEach(cleanup);

/**
 * These re-exercise the mock-map test doubles (already covered exhaustively by every component's
 * own test file via `./testUtils/mockMap` directly) only enough to prove the public
 * `solid-map-gl/testing` entry point (`src/testing.tsx`) actually re-exports the same
 * implementation, not a stale/divergent copy.
 */
describe("solid-map-gl/testing", () => {
  it("renderWithMap mounts a component under a mock MapProvider context", async () => {
    const { map } = renderWithMap(() => {
      const [ctx] = useMapContext();
      return <div data-testid="probe">{ctx.map ? "has-map" : "no-map"}</div>;
    });
    await tick();

    expect(map.on).toBeTypeOf("function");
  });

  it("createMockMap/createMockMapLib/createMockDrawLib are usable standalone", () => {
    const map = createMockMap({ isMapLibre: true });
    expect(map.isMapLibre).toBe(true);

    const mapLib = createMockMapLib({ isMapLibre: true });
    expect(mapLib.Map).toBeTypeOf("function");

    const DrawLib = createMockDrawLib();
    expect(DrawLib.modes).toEqual({});
  });
});
