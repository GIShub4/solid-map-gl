import {
  createSignal,
  createEffect,
  onCleanup,
  splitProps,
  untrack,
  VoidComponent,
} from "solid-js";
import { useMapContext } from "../MapProvider";
import type { Options as AttributionOptions } from "mapbox-gl/src/ui/control/attribution_control";
import type { Options as FullscreenOptions } from "mapbox-gl/src/ui/control/fullscreen_control";
import type { Options as GeolocateOptions } from "mapbox-gl/src/ui/control/geolocate_control";
import type { Options as NavigationOptions } from "mapbox-gl/src/ui/control/navigation_control";
import type { Options as ScaleOptions } from "mapbox-gl/src/ui/control/scale_control";

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
    | NavigationOptions
    | ScaleOptions
    | AttributionOptions
    | FullscreenOptions
    | GeolocateOptions
    | object;
  custom?: any;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

export const Control: VoidComponent<Props> = (props) => {
  const [ctx] = useMapContext();
  const [update, create] = splitProps(props, ["position"]);
  const [control, setControl] = createSignal<any>(null);

  const controlClasses = new Map<ControlType, any>([
    ["navigation", window.MapLib.NavigationControl],
    ["scale", window.MapLib.ScaleControl],
    ["attribution", window.MapLib.AttributionControl],
    ["geolocate", window.MapLib.GeolocateControl],
    ["fullscreen", window.MapLib.FullscreenControl],
    ["logo", window.MapLib.LogoControl],
    ["terrain", window.MapLib.TerrainControl],
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

  // Update Position
  createEffect(() => {
    ctx.map.hasControl(control()) && ctx.map.removeControl(control());
    ctx.map.addControl(control(), update.position);
  });

  onCleanup(() => {
    ctx.map.hasControl(control()) && ctx.map.removeControl(control());
  });

  return null;
};
