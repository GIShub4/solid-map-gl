import { onCleanup, createEffect, VoidComponent } from "solid-js";
import { useMapContext } from "../MapProvider";
import type { Fog } from "mapbox-gl";

interface AtmosphereProps {
  /** Fog/Atmosphere Specifications */
  style?: Fog;
}

export const Atmosphere: VoidComponent<AtmosphereProps> = (props) => {
  const [ctx] = useMapContext();

  // Add or Update Atmosphere Layer
  createEffect(() => ctx.map.setFog(props.style || {}));

  // Remove Atmosphere Layer
  onCleanup(() => {
    if (ctx.map.getFog()) ctx.map.setFog(null);
  });

  return null;
};
