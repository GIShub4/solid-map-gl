// Shared by `MapGL`'s `onTilesLoaded` prop and the standalone off-screen capture utilities
// (`offscreenCapture.ts`) — both need the same "is this map actually done, visually" check, one
// wired to a component's own event prop, the other usable directly against a raw
// mapboxgl.Map/maplibregl.Map that was never rendered through `<MapGL>` at all (e.g. a headless map
// built for image/PDF export). Kept framework-agnostic (no SolidJS import) on purpose so it works
// either way.

/** Any object shaped enough like `mapboxgl.Map`/`maplibregl.Map` for the functions in this module —
 * kept loose (not the real `mapboxgl.Map` type) so this file has no hard dependency on either
 * library's types. */
export type SettleableMap = {
  areTilesLoaded(): boolean;
  triggerRepaint(): void;
  once(event: "idle", cb: () => void): unknown;
  style?: { hasTransitions?: () => boolean };
};

// `triggerRepaint()` schedules mapbox-gl/maplibre-gl's own requestAnimationFrame callback (the one
// that runs the actual WebGL draw calls) synchronously, in the same tick as the call. Awaiting a
// requestAnimationFrame registered right after it lands later in that same frame's callback queue —
// rAF callbacks for a given frame run synchronously, in registration order — so by the time this
// resolves, that draw call has already executed.
export const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

// mapbox-gl-js/maplibre-gl-js expose no public event or method for "the raster cross-fade/opacity
// ramp has finished" — the actual mechanism (each tile's `fadeEndTime` vs. the current time) is
// internal, reached here only via the semi-public `map.style` object. Best-effort, not
// authoritative: the internal `hasTransitions()` only scans the *root* style's own layers/sources,
// not those belonging to imported style fragments (Mapbox's Standard/Standard Satellite styles are
// fragment-composed) — so this can report `false` while a fragment-owned tile is still genuinely
// fading. That's why it's paired with a flat fallback delay in `settleAfterIdle` instead of being
// trusted alone.
export const hasActiveFadeTransition = (map: SettleableMap): boolean => {
  try {
    return !!map.style?.hasTransitions?.();
  } catch {
    return false;
  }
};

/** Polls `map.areTilesLoaded()` every 100ms, bounded by `timeout` (ms) so a permanently-erroring
 * tile can't hang forever — an errored tile's `state` also counts as "settled" for
 * `areTilesLoaded()`, so this only guards against a tile stuck mid-fetch, not a real load failure.
 * Resolves `true` if tiles genuinely finished loading, `false` if it gave up on the timeout. */
export function pollTilesLoaded(map: SettleableMap, timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeout;
    const poll = () => {
      if (map.areTilesLoaded()) {
        resolve(true);
        return;
      }
      if (Date.now() >= deadline) {
        resolve(false);
        return;
      }
      setTimeout(poll, 100);
    };
    poll();
  });
}

export type SettleOptions = {
  /** Max time (ms) to keep polling `areTilesLoaded()` before giving up and moving on anyway.
   * Default 10000. */
  timeout?: number;
  /** Extra flat delay (ms) to outlast a `raster-fade-duration` cross-fade still in flight after
   * tiles report loaded — there's no public event for "the fade finished", and the internal
   * tracking (`hasActiveFadeTransition`) doesn't reliably cover imported style fragments (e.g.
   * Standard/Standard Satellite). Default 400 (mapbox-gl's own `raster-fade-duration` default is
   * 300). Set to 0 to skip this step entirely. */
  fadeMargin?: number;
};

/** The actual "is this map done, visually" check: polls `areTilesLoaded()`, confirms a real paint
 * via two animation frames, then (unless `fadeMargin` is 0) waits out any raster-fade cross-fade
 * still in flight. Call this from inside your own `map.once('idle', ...)` — it doesn't listen for
 * 'idle' itself, since 'idle' can otherwise fire while raster tiles are still fetching, mid
 * GPU-upload, or still cross-fading in, none of which 'idle' itself waits out. Use
 * `waitForIdleAndSettle` for the common case of "wait for the next idle, then this". */
export async function settleAfterIdle(map: SettleableMap, options: SettleOptions = {}): Promise<void> {
  const { timeout = 10000, fadeMargin = 400 } = options;
  await pollTilesLoaded(map, timeout);
  map.triggerRepaint();
  await nextFrame();
  await nextFrame();
  if (fadeMargin > 0) {
    const fadeDeadline = Date.now() + Math.max(fadeMargin, 2000);
    while (hasActiveFadeTransition(map) && Date.now() < fadeDeadline) {
      map.triggerRepaint();
      await nextFrame();
    }
    await new Promise((resolve) => setTimeout(resolve, fadeMargin));
    map.triggerRepaint();
    await nextFrame();
    await nextFrame();
  }
}

/** Waits for the map's next 'idle' event, then `settleAfterIdle`. The convenience entry point for
 * off-screen/headless capture: call your own `jumpTo`/`fitBounds`/`setData` first, then `await` this
 * before reading the canvas. Calls `triggerRepaint()` itself before waiting — 'idle' only fires on
 * the *transition into* idle, so a map that's already idle with nothing queued (e.g. capturing
 * whatever's on screen with no preceding camera/data change) would otherwise never fire another one
 * and this would hang forever. Redundant, and harmless, if the map isn't idle yet: mapbox-gl/
 * maplibre-gl coalesce repeated `triggerRepaint()` calls into whatever frame is already pending. */
export function waitForIdleAndSettle(map: SettleableMap, options: SettleOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    map.once("idle", () => {
      settleAfterIdle(map, options).then(resolve);
    });
    map.triggerRepaint();
  });
}

/** Zeros `raster-fade-duration` on every layer that supports it, so newly-loaded raster tiles
 * appear at full opacity immediately instead of cross-fading in over mapbox-gl's default 300ms —
 * that fade is a paint-time opacity animation, invisible to `areTilesLoaded()`/`isSourceLoaded()`,
 * so a capture taken right on load/idle can otherwise catch tiles still visibly fading in. Tries
 * every layer rather than filtering to `type === "raster"`: some styles (e.g. Mapbox's
 * Standard/Standard Satellite family) compose their base imagery in ways that don't always surface
 * as a plain `"raster"`-typed layer in `getStyle().layers`, so filtering by type risked silently
 * missing the actual imagery layer — `setPaintProperty` throwing for a layer type that doesn't
 * support this property is caught and ignored instead. */
export function disableRasterFade(map: { getStyle(): { layers?: { id: string }[] } | undefined; setPaintProperty(id: string, name: string, value: unknown): void }): void {
  for (const layer of map.getStyle()?.layers ?? []) {
    try {
      map.setPaintProperty(layer.id, "raster-fade-duration", 0);
    } catch {
      // Layer type doesn't support this paint property — expected for the vast majority of layers.
    }
  }
}
