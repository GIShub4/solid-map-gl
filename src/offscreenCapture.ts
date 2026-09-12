// Backs <MapGL>'s `offscreen` prop / `onCapturerReady` callback — see MapGL/index.tsx. Kept as a
// separate module (rather than inlined there) since MapGL/index.tsx is already large.
import { waitForIdleAndSettle, type SettleOptions } from "./tilesSettled";

/** Handed to `<MapGL offscreen>`'s `onCapturerReady` callback. */
export type MapCapturer = {
  /** The raw mapboxgl.Map/maplibregl.Map instance — for anything not already covered by
   * `<Source>`/`<Layer>` children, e.g. reading back computed values. Camera/data changes are
   * still made the normal declarative way, via `<MapGL>`'s own `viewport` prop and `<Source>`'s
   * `data` prop. */
  map: any;
  /** Waits for the map's next 'idle', then for every tile to be genuinely loaded, painted, and (if
   * applicable) done cross-fading in — see `waitForIdleAndSettle`. Call this after changing
   * `viewport`/`data` props. */
  waitUntilSettled(): Promise<void>;
  /** `map.getCanvas().toDataURL(type, quality)`. Call after `waitUntilSettled()`, or use
   * `captureWhenSettled()` to do both in one call. The result can be handed to any PDF/document
   * library — this doesn't depend on or assume one. */
  capture(type?: string, quality?: number): string;
  /** `await waitUntilSettled()` then `capture()`, in one call. */
  captureWhenSettled(type?: string, quality?: number): Promise<string>;
};

export function createCapturer(map: any, settleOptions: SettleOptions): MapCapturer {
  return {
    map,
    waitUntilSettled: () => waitForIdleAndSettle(map, settleOptions),
    capture: (type = "image/jpeg", quality = 0.92) => map.getCanvas().toDataURL(type, quality),
    captureWhenSettled: async (type = "image/jpeg", quality = 0.92) => {
      await waitForIdleAndSettle(map, settleOptions);
      return map.getCanvas().toDataURL(type, quality);
    },
  };
}
