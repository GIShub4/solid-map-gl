import { createEffect, onCleanup } from "solid-js";
import { useMapContext } from "../components/MapProvider";

/**
 * Keeps an already-constructed `IControl` added to the map at `position`, moving it
 * (remove + re-add, never recreating it) whenever the control instance or position changes,
 * and removing it on cleanup. Shared `addControl`/`removeControl` lifecycle for `Control` and
 * `DeckOverlay` — callers stay responsible for deciding *when* to (re)create the control
 * instance itself (e.g. on `type`/`options` changes), since that policy differs per component.
 */
export const useControlPosition = (
  control: () => any,
  position?: () => string | undefined,
) => {
  const [ctx] = useMapContext();

  createEffect(() => {
    const c = control();
    const pos = position?.();
    if (!c) return;
    ctx.map.hasControl(c) && ctx.map.removeControl(c);
    ctx.map.addControl(c, pos as any);
  });

  onCleanup(() => {
    const c = control();
    c && ctx.map.hasControl(c) && ctx.map.removeControl(c);
  });
};
