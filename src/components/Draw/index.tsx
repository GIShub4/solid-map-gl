import { onCleanup, VoidComponent } from "solid-js";
import { useMapContext } from "../MapProvider";
import { drawEvents } from "../../events";
import type { drawEventTypes } from "../../events";
import MultiPointMode from "./modes/multi_point";
import LineStringeMode from "./modes/line_string";
import PointMode from "./modes/point";
import PolygonMode from "./modes/polygon";
import RadiusMode from "./modes/radius";
import RectangleMode from "./modes/rectangle";
import RectangleAssistedMode from "./modes/rectangle_assisted";
import styles from "./drawingStyles";

type Props = {
  /** Draw Library */
  lib: any;
  /** Draw Options */
  options?: object;
  /** Draw Control Position */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Draw Control Instance */
  getInstance?: (object) => void;
  showLength?: boolean;
  showArea?: boolean;
} & drawEventTypes;

export const Draw: VoidComponent<Props> = (props: Props) => {
  const [ctx] = useMapContext();

  // MapLibre stopped using Mapbox's CSS class names internally; mapbox-gl-draw reads them via
  // this static, so on MapLibre keyboard shortcuts (Delete/Backspace/1/2/3) and native-looking
  // control styling silently don't work unless patched before instantiating (mouse-driven
  // drawing itself is unaffected — see STAGE0_FINDINGS.md).
  if (ctx.isMapLibre && props.lib.constants?.classes) {
    Object.assign(props.lib.constants.classes, {
      CANVAS: "maplibregl-canvas",
      CONTROL_BASE: "maplibregl-ctrl",
      CONTROL_PREFIX: "maplibregl-ctrl-",
      CONTROL_GROUP: "maplibregl-ctrl-group",
      ATTRIBUTION: "maplibregl-ctrl-attrib",
    });
  }

  // Add Draw Control
  // draw_point/draw_line_string/draw_polygon override the built-in modes so
  // showLength/showArea work through the control's own toolbar buttons;
  // multi_point/radius/rectangle/rectangle_assisted have no built-in
  // equivalent and are opt-in via draw.changeMode(...).
  const draw = new props.lib({
    styles: [...props.lib.lib.theme, ...styles],
    modes: {
      ...props.lib.modes,
      draw_point: PointMode(props.lib),
      draw_line_string: LineStringeMode(props.lib),
      draw_polygon: PolygonMode(props.lib),
      multi_point: MultiPointMode,
      radius: RadiusMode(props.lib),
      rectangle: RectangleMode(props.lib),
      rectangle_assisted: RectangleAssistedMode,
    },
    userProperties: {
      showLength: props.showLength || false,
      showArea: props.showArea || false,
    },
    ...props.options,
  });
  ctx.map.addControl(draw, props.position || "top-right");
  props.getInstance && props.getInstance(draw);

  // Hook up events
  const eventList: Record<string, (evt: any) => void> = {};
  drawEvents.forEach((item) => {
    if (props[item]) {
      const event = `draw.${item.slice(2).toLowerCase()}`;
      const fn = (evt) => props[item](evt);
      eventList[event] = fn;
      ctx.map.on(event, fn);
    }
  });

  // Remove Draw Control
  onCleanup(() => {
    // Remove Events
    Object.keys(eventList).forEach((event) =>
      ctx.map.off(event, eventList[event]),
    );
    // Remove Control
    ctx.map?.removeControl(draw);
  });

  return null;
};
