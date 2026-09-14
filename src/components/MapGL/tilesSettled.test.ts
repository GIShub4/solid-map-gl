import { describe, it, expect, afterEach, vi } from "vitest";
import { createMockMap } from "../../testUtils/mockMap";
import {
  pollTilesLoaded,
  settleAfterIdle,
  waitForIdleAndSettle,
  hasActiveFadeTransition,
  disableRasterFade,
} from "./tilesSettled";

afterEach(() => vi.useRealTimers());

describe("pollTilesLoaded", () => {
  it("resolves true immediately when areTilesLoaded is already true", async () => {
    const map = createMockMap();
    await expect(pollTilesLoaded(map as any, 1000)).resolves.toBe(true);
  });

  it("polls until areTilesLoaded reports true", async () => {
    vi.useFakeTimers();
    const map = createMockMap();
    map.areTilesLoaded.mockReturnValueOnce(false).mockReturnValueOnce(false);

    const promise = pollTilesLoaded(map as any, 10000);
    await vi.advanceTimersByTimeAsync(250);

    await expect(promise).resolves.toBe(true);
  });

  it("resolves false once the timeout elapses with tiles still not loaded", async () => {
    vi.useFakeTimers();
    const map = createMockMap();
    map.areTilesLoaded.mockReturnValue(false);

    const promise = pollTilesLoaded(map as any, 250);
    await vi.advanceTimersByTimeAsync(300);

    await expect(promise).resolves.toBe(false);
  });
});

describe("hasActiveFadeTransition", () => {
  it("returns false when map.style is absent", () => {
    const map = createMockMap();
    expect(hasActiveFadeTransition(map as any)).toBe(false);
  });

  it("reflects map.style.hasTransitions()", () => {
    const map: any = createMockMap();
    map.style = { hasTransitions: () => true };
    expect(hasActiveFadeTransition(map)).toBe(true);

    map.style.hasTransitions = () => false;
    expect(hasActiveFadeTransition(map)).toBe(false);
  });

  it("swallows a throwing hasTransitions and returns false", () => {
    const map: any = createMockMap();
    map.style = {
      hasTransitions: () => {
        throw new Error("boom");
      },
    };
    expect(hasActiveFadeTransition(map)).toBe(false);
  });
});

describe("settleAfterIdle", () => {
  it("resolves once tiles are loaded and a frame has confirmed the paint, skipping the fade wait when fadeMargin is 0", async () => {
    vi.useFakeTimers();
    const map = createMockMap();

    const promise = settleAfterIdle(map as any, { fadeMargin: 0 });
    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).resolves.toBeUndefined();
    expect(map.triggerRepaint).toHaveBeenCalled();
  });

  it("waits out the flat fade margin before resolving", async () => {
    vi.useFakeTimers();
    const map = createMockMap();
    let resolved = false;

    settleAfterIdle(map as any, { fadeMargin: 400 }).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(300);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(200);
    expect(resolved).toBe(true);
  });

  it("keeps repainting while hasActiveFadeTransition is true, then settles once it clears", async () => {
    vi.useFakeTimers();
    const map: any = createMockMap();
    const hasTransitions = vi
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValue(false);
    map.style = { hasTransitions };
    let resolved = false;

    settleAfterIdle(map, { fadeMargin: 100 }).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(1000);
    expect(resolved).toBe(true);
    expect(hasTransitions).toHaveBeenCalled();
    expect(map.triggerRepaint.mock.calls.length).toBeGreaterThan(1);
  });

  it("gives up polling areTilesLoaded after `timeout` and still resolves", async () => {
    vi.useFakeTimers();
    const map = createMockMap();
    map.areTilesLoaded.mockReturnValue(false);
    let resolved = false;

    settleAfterIdle(map as any, { timeout: 200, fadeMargin: 0 }).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(150);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(200);
    expect(resolved).toBe(true);
  });
});

describe("waitForIdleAndSettle", () => {
  it("waits for the map's next idle before settling", async () => {
    vi.useFakeTimers();
    const map = createMockMap();
    const onDone = vi.fn();

    waitForIdleAndSettle(map as any, { fadeMargin: 0 }).then(onDone);

    await vi.advanceTimersByTimeAsync(100);
    expect(onDone).not.toHaveBeenCalled();

    map.fire("idle", {});
    await vi.advanceTimersByTimeAsync(100);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe("disableRasterFade", () => {
  it("sets raster-fade-duration to 0 on every layer", () => {
    const map = createMockMap();
    map.getStyle.mockReturnValue({
      layers: [
        { id: "sat", type: "raster" },
        { id: "roads", type: "line" },
      ],
    });

    disableRasterFade(map as any);

    expect(map.setPaintProperty).toHaveBeenCalledWith("sat", "raster-fade-duration", 0);
    expect(map.setPaintProperty).toHaveBeenCalledWith("roads", "raster-fade-duration", 0);
  });

  it("swallows setPaintProperty throwing for layer types that don't support the property", () => {
    const map = createMockMap();
    map.getStyle.mockReturnValue({ layers: [{ id: "x", type: "symbol" }] });
    map.setPaintProperty.mockImplementation(() => {
      throw new Error("unsupported property");
    });

    expect(() => disableRasterFade(map as any)).not.toThrow();
  });
});
