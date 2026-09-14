import { createSignal, createEffect, splitProps, untrack, VoidComponent } from "solid-js";
import { useMapContext } from "../MapProvider";
import { useControlPosition } from "../../lib/createMapControl";
import type {
  AttributionControlOptions,
  FullscreenControlOptions,
  GeolocateControlOptions,
  NavigationControlOptions,
  ScaleControlOptions,
} from "mapbox-gl";

type ControlType =
  | "navigation"
  | "scale"
  | "attribution"
  | "fullscreen"
  | "geolocate"
  | "logo"
  | "terrain";

type Props = {
  type?: ControlType;
  options?:
    | NavigationControlOptions
    | ScaleControlOptions
    | AttributionControlOptions
    | FullscreenControlOptions
    | GeolocateControlOptions
    | object;
  custom?: any;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

export const Control: VoidComponent<Props> = (props) => {
  const [ctx] = useMapContext();
  const [update, create] = splitProps(props, ["position"]);
  const [control, setControl] = createSignal<any>(null);

  const controlClasses = new Map<ControlType, any>([
    ["navigation", ctx.mapLib.NavigationControl],
    ["scale", ctx.mapLib.ScaleControl],
    ["attribution", ctx.mapLib.AttributionControl],
    ["geolocate", ctx.mapLib.GeolocateControl],
    ["fullscreen", ctx.mapLib.FullscreenControl],
    ["logo", ctx.mapLib.LogoControl],
    ["terrain", ctx.mapLib.TerrainControl],
  ]);

  // Add Control
  createEffect(() => {
    untrack(
      () =>
        control() &&
        ctx.map.hasControl(control()) &&
        ctx.map.removeControl(control()),
    );
    setControl(
      create.custom ||
        new (controlClasses.get(create.type || "navigation"))(create.options),
    );
  });

  // Update Position (shared with DeckOverlay)
  useControlPosition(control, () => update.position);

  return null;
};
