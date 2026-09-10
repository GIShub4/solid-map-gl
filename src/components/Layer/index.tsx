import {
  onCleanup,
  createEffect,
  createMemo,
  Component,
  createUniqueId,
} from "solid-js";
import { useMapContext } from "../MapProvider";
import { useSourceId } from "../Source";
import { layerEvents } from "../../events";
import { baseStyle, layoutStyles } from "../../styles";
import { resolveColor as resolveColorValue } from "../../colors";
import type { layerEventTypes } from "../../events";
import type { FilterSpecification, CustomLayerInterface } from "mapbox-gl";

// `style` accepts a mix of base layer keys (`type`, `filter`, `minzoom`/`maxzoom`,
// `source-layer`) and flat paint/layout properties (e.g. `fillColor` or `fill-color`), which
// `updateStyle()` buckets into real `paint`/`layout` objects — never a literal `LayerSpecification`
// or `StyleSpecification`, so those mapbox-gl types don't actually describe this shape.
type FlatLayerStyle = Record<string, any>;

const diff = (
  newProps: FlatLayerStyle = {},
  prevProps: FlatLayerStyle = {},
): [string, any][] => {
  const keys = new Set([...Object.keys(newProps), ...Object.keys(prevProps)]);
  return [...keys].reduce((acc, key: string) => {
    const value = newProps[key];
    if (value !== prevProps[key]) {
      acc.push([key, value]);
    }
    return acc;
  }, []);
};

type Props = {
  id?: string;
  /** A string that uniquely identifies the layer. If not provided, a unique ID will be generated. */
  style?: FlatLayerStyle;
  /** A Mapbox Style Specification object that defines the visual appearance of the layer. */
  customLayer?: CustomLayerInterface;
  /** An object that implements the `CustomLayerInterface` interface, which allows you to create custom layers using WebGL. */
  filter?: FilterSpecification;
  /** A Mapbox filter specification that defines which features of the layer to include or exclude from the layer. */
  visible?: boolean;
  /** A boolean that determines whether the layer is visible or not. */
  sourceId?: string;
  /** A string that specifies the ID of the source that the layer uses for its data. */
  slot?: "bottom" | "middle" | "top" | string;
  /** A string that specifies the slot to which the layer belongs. */
  beforeType?:
    | "background"
    | "fill"
    | "line"
    | "symbol"
    | "raster"
    | "circle"
    | "fill-extrusion"
    | "heatmap"
    | "hillshade"
    | "sky"
    | string;
  /** A string that specifies the type of layer before which the current layer should be inserted. */
  beforeId?: string;
  /** A string that specifies the ID of the layer before which the current layer should be inserted. */
  featureState?: { id: number | string; state: Record<string, any> };
  /** An object that specifies the state of a feature in the layer. The object consists of an ID (either a number or a string) and an object containing the state. */
  children?: any;
  /** Any content that should be rendered within the layer. */
} & layerEventTypes;

const newKey = (key, type) =>
  (key.startsWith(type) || key.startsWith("icon") || key.startsWith("text")
    ? ""
    : type + "-") + key.replace(/[A-Z]/g, (s) => "-" + s.toLowerCase());

// Lets paint colors be given as a Tailwind palette name (`fillColor: 'blue-600'`) or a CSS Color 4
// function Mapbox can't parse (`fillColor: 'oklch(54.6% 0.245 262.881)'`), alongside any format
// Mapbox already understands — see `resolveColorValue` in `src/colors.ts`.
const resolveColor = (key: string, value: any) =>
  key.endsWith("color") && typeof value === "string"
    ? resolveColorValue(value)
    : value;

const constantRef = /^@(.+)$/;

// Resolves a `"@name"` reference against the `constants` prop passed to `<MapGL>` (see
// `MapProvider`'s `ctx.constants`) — the JS-side equivalent of the `@name`/`constants` feature the
// Mapbox GL style spec itself dropped after v7. Reads `constants[name]` directly (rather than e.g.
// `in`/`hasOwnProperty`) so a plain property access on the `solid-js/store` proxy is what
// establishes the reactive dependency, letting a `constants` prop change re-run just the Layer
// effects that reference the changed name. Applied to every paint/layout value, not just colors,
// since a constant can hold a width or any other value type just as well as a color.
const resolveConstant = (
  key: string,
  value: any,
  constants: Record<string, any>,
  debug: (text: string, value?: any) => void,
) => {
  if (typeof value !== "string") return value;
  const match = value.match(constantRef);
  if (!match) return value;
  const resolved = constants[match[1]];
  if (resolved === undefined) {
    debug(`Unknown constant "@${match[1]}" referenced by "${key}" — leaving unresolved`);
    return value;
  }
  return resolved;
};

const updateStyle = (
  oldStyle: FlatLayerStyle,
  constants: Record<string, any> = {},
  debug: (text: string, value?: any) => void = () => {},
): FlatLayerStyle => {
  if (!oldStyle) return;
  let layout = {};
  let paint = {};
  let style = {};

  const resolvePaint = (key: string, value: any) =>
    resolveColor(key, resolveConstant(key, value, constants, debug));

  Object.entries(oldStyle).forEach(([key, value]) => {
    if (baseStyle.includes(key)) style[key] = value;
    else {
      const nk = newKey(key, oldStyle.type);
      layoutStyles.includes(nk)
        ? (layout[nk] = resolveConstant(nk, value, constants, debug))
        : (paint[nk] = resolvePaint(nk, value));
    }
  });
  if (oldStyle.paint)
    Object.entries(oldStyle.paint).forEach(([key, value]) => {
      const nk = newKey(key, oldStyle.type);
      paint[nk] = resolvePaint(nk, value);
    });
  if (oldStyle.layout)
    Object.entries(oldStyle.layout).forEach(([key, value]) => {
      const nk = newKey(key, oldStyle.type);
      layout[nk] = resolveConstant(nk, value, constants, debug);
    });
  return { ...style, paint, layout };
};

export const Layer: Component<Props> = (props) => {
  const [ctx] = useMapContext();
  const sourceId: string =
    props.sourceId || props.style?.source || useSourceId();
  const layerId: string = props.id || props.customLayer?.id || createUniqueId();

  const debug = (text, value?) => {
    (ctx.map.debug || ctx.map.debugEvents) &&
      console.debug("%c[MapGL]", "color: #10b981", text, value || "");
  };

  const getBeforeId = createMemo(() =>
    props.beforeType
      ? ctx.map.getStyle().layers.find((l) => l.type === props.beforeType)?.id
      : props.beforeId,
  );

  // Add Layer
  ctx.map.addLayer(
    (props.customLayer || {
      ...updateStyle(props.style, ctx.constants, debug),
      id: layerId,
      source: sourceId,
      // `slot` is Mapbox Standard-Style-only — MapLibre has no equivalent (see docs/dev-notes.md)
      ...(ctx.isMapLibre ? {} : { slot: props.slot || "" }),
      metadata: {
        smg: { beforeType: props.beforeType, beforeId: props.beforeId },
      },
    }) as any,
    getBeforeId(),
  );
  ctx.map.layerIdList.push(layerId);
  if (props.customLayer) ctx.map.fire("load");
  debug("Add Layer:", layerId);

  // Hook up events
  layerEvents.forEach((item) => {
    if (props[item]) {
      const event = item.slice(2).toLowerCase();
      ctx.map.on(event, layerId, (evt) => {
        evt.clickOnLayer = true;
        props[item](evt);
        ctx.map.debugEvents &&
          debug(`Layer '${event}' event on '${layerId}':`, evt);
      });
    }
  });

  // Update Style
  createEffect((prev: FlatLayerStyle) => {
    // Read (not otherwise used) so any environment change MapGL noticed (a matchMedia firing, or
    // any attribute mutation on <html>/<body> — not just a "dark" class) re-runs this effect,
    // needed to re-probe any "bg-x dark:bg-y" color pair (see resolveColor in src/colors.ts): the
    // browser's cascade decides which of the two applies, but nothing tells Solid to re-read that
    // cascade on its own, so this stands in as the "please re-check" trigger.
    ctx.themeVersion;
    const style = updateStyle(props.style, ctx.constants, debug);
    if (style === prev) return;

    if (style.layout !== prev?.layout)
      diff(style.layout, prev?.layout).forEach(([key, value]) =>
        ctx.map.setLayoutProperty(layerId, key as any, value, { validate: false }),
      );

    if (style.paint !== prev?.paint)
      diff(style.paint, prev?.paint).forEach(([key, value]) =>
        ctx.map.setPaintProperty(layerId, key as any, value, { validate: false }),
      );

    if (style.minzoom !== prev?.minzoom || style.maxzoom !== prev?.maxzoom)
      ctx.map.setLayerZoomRange(layerId, style.minzoom, style.maxzoom);

    if (style.filter !== prev?.filter)
      ctx.map.setFilter(layerId, style.filter, { validate: false });

    debug("Update Layer Style:", layerId);
    return style;
  }, updateStyle(props.style, ctx.constants, debug));

  // Update Visibility
  createEffect((prev: boolean) => {
    if (props.visible === prev) return;

    ctx.map.setLayoutProperty(
      layerId,
      "visibility",
      props.visible ? "visible" : "none",
      { validate: false },
    );
    debug(`Update Visibility (${layerId}):`, props.visible.toString());
    return props.visible;
  }, props.visible);

  // Update Layer Z-Index
  createEffect((prev: string) => {
    if (getBeforeId() === prev) return prev;

    ctx.map.moveLayer(layerId, getBeforeId());
    debug(`Update Layer Z-Index (${layerId}):`, getBeforeId());
    return getBeforeId();
  }, getBeforeId());

  // Update Filter
  createEffect(async () => {
    if (!props.filter) return;

    !ctx.map.isStyleLoaded() && (await ctx.map.once("styledata"));
    ctx.map.setFilter(layerId, props.filter);
    debug(`Update Filter (${layerId}):`, props.filter);
  });

  // Update Feature State
  createEffect(async () => {
    if (!props.featureState || props.featureState.id === null) return;

    !ctx.map.isStyleLoaded() && (await ctx.map.once("styledata"));

    ctx.map.removeFeatureState({
      source: sourceId,
      sourceLayer: props.style["source-layer"],
    });
    ctx.map.setFeatureState(
      {
        source: sourceId,
        sourceLayer: props.style["source-layer"],
        id: props.featureState.id,
      },
      props.featureState.state,
    );
  });

  //Remove Layer
  onCleanup(() => ctx.map?.getLayer(layerId) && ctx.map?.removeLayer(layerId));

  return props.children;
};
