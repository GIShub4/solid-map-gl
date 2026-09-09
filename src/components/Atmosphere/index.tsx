import { onCleanup, createEffect, VoidComponent } from "solid-js";
import { useMapContext } from "../MapProvider";
import type { FogSpecification } from "mapbox-gl";

/** MapLibre's `sky` style-spec object — a genuinely different shape from Mapbox's `Fog`,
 * not a variant of it. */
export interface MapLibreSky {
  "sky-color"?: string;
  "sky-horizon-blend"?: number;
  "horizon-color"?: string;
  "horizon-fog-blend"?: number;
  "fog-color"?: string;
  "fog-ground-blend"?: number;
  "atmosphere-blend"?: number;
}

interface AtmosphereProps {
  /** Fog (Mapbox) or Sky (MapLibre) Specification — shape depends on the active base library */
  style?: FogSpecification | MapLibreSky;
}

export const Atmosphere: VoidComponent<AtmosphereProps> = (props) => {
  const [ctx] = useMapContext();

  // Add or Update Atmosphere Layer
  createEffect(() => {
    if (ctx.isMapLibre) (ctx.map as any).setSky?.(props.style || {});
    else ctx.map.setFog((props.style as FogSpecification) || {});
  });

  // Remove Atmosphere Layer
  onCleanup(() => {
    if (ctx.isMapLibre) {
      (ctx.map as any).getSky?.() && (ctx.map as any).setSky(null);
    } else if (ctx.map.getFog()) {
      ctx.map.setFog(null);
    }
  });

  return null;
};
