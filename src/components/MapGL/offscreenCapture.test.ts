import { describe, it, expect, afterEach, vi } from "vitest";
import { createMockMap } from "../../testUtils/mockMap";
import { createCapturer } from "./offscreenCapture";

describe("createCapturer", () => {
  afterEach(() => vi.useRealTimers());

  it("exposes the raw map instance", () => {
    const map = createMockMap();
    const capturer = createCapturer(map as any, { fadeMargin: 0 });
    expect(capturer.map).toBe(map);
  });

  it("capture() reads the canvas directly without waiting", () => {
    const map = createMockMap();
    map.getCanvas.mockReturnValue({ toDataURL: vi.fn(() => "data:image/png;base64,abc") });
    const capturer = createCapturer(map as any, { fadeMargin: 0 });

    expect(capturer.capture("image/png")).toBe("data:image/png;base64,abc");
  });

  it("captureWhenSettled waits for idle + settle before resolving with the canvas data URL", async () => {
    vi.useFakeTimers();
    const map = createMockMap();
    map.getCanvas.mockReturnValue({ toDataURL: vi.fn(() => "data:image/jpeg;base64,xyz") });
    const capturer = createCapturer(map as any, { fadeMargin: 0 });

    const resultPromise = capturer.captureWhenSettled();
    map.fire("idle", {});
    await vi.advanceTimersByTimeAsync(200);

    await expect(resultPromise).resolves.toBe("data:image/jpeg;base64,xyz");
  });

  it("waitUntilSettled resolves once idle fires and tiles settle", async () => {
    vi.useFakeTimers();
    const map = createMockMap();
    const capturer = createCapturer(map as any, { fadeMargin: 0 });
    const onDone = vi.fn();

    capturer.waitUntilSettled().then(onDone);
    await vi.advanceTimersByTimeAsync(100);
    expect(onDone).not.toHaveBeenCalled();

    map.fire("idle", {});
    await vi.advanceTimersByTimeAsync(100);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
