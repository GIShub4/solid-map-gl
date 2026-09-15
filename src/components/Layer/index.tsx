import {
  onCleanup,
  createEffect,
  createMemo,
  Component,
  createUniqueId,
} from "solid-js";
import { useMapContext } from "../MapProvider";
import { useSourceId } from "../Source";
import { layerEvents } from "../../lib/events";
import { baseStyle, layoutStyles } from "./styles";
import { resolveColor as resolveColorValue, toRgbaComponents } from "./colors";
import type { layerEventTypes } from "../../lib/events";
import type { FilterSpecification, CustomLayerInterface } from "mapbox-gl";

// `style` accepts a mix of base layer keys (`type`, `filter`, `minzoom`/`maxzoom`,
// `source-layer`) and flat paint/layout properties (e.g. `fillColor` or `fill-color`), which
// `updateStyle()` buckets into real `paint`/`layout` objects — never a literal `LayerSpecification`
// or `StyleSpecification`, so those mapbox-gl types don't actually describe this shape.
type FlatLayerStyle = Record<string, any>;

type PulseConfig = {
  /** The paint property to animate, e.g. `"icon-halo-width"`, `"icon-opacity"`, or a
   *  `*-color` property (e.g. `"icon-halo-color"`) to fade/shift a color instead of a number.
   *  Default `"icon-halo-width"` — override for anything other than a symbol layer's halo
   *  (e.g. `"circle-radius"`/`"circle-opacity"` on a circle layer). */
  property?: string;
  /** Start value — a number for a plain paint property, or any CSS color string (hex, named,
   *  rgb/rgba, a Tailwind name, ...) when animating a `*-color` property. Default `0`. */
  from?: number | string;
  /** Default `4` — see `PULSE_DEFAULTS`'s comment for why this stays under mapbox's fixed
   *  `icon-halo-width <~ 6 * icon-size` ceiling before the halo fills the whole icon. */
  to?: number | string;
  /** Full cycle length, in ms. Default `1500`. */
  duration?: number;
  /** - `"out"` (default): a one-directional ease-out ramp from `from` to `to`, holding at `to`
   *    for the last quarter of the cycle before resetting — Tailwind's `animate-ping` shape
   *    (e.g. a ring that grows outward and fades, then disappears until the next cycle). The
   *    most common "pulsing dot" look.
   *  - `"in"`: the mirror of `"out"` — ramps from `to` down to `from`, holding at `from`.
   *  - `"in-out"`: smooth back-and-forth between `from` and `to`, forever (sine-eased) — e.g. a
   *    halo that grows and shrinks continuously, with no reset. */
  waveform?: "in-out" | "out" | "in";
};

// Every field defaults so `pulse` (or `pulse={{}}`/`pulse={{ to: 16 }}`) works out of the box for
// the common case — Tailwind's familiar `animate-ping` look on a symbol layer's halo — and only
// needs overriding piece by piece (a different property, range, or layer type) as requirements grow.
//
// `to: 4` (not a rounder-looking 8) because mapbox-gl-js's symbol fragment shader hardcodes
// `SDF_PX = 8.0` and computes the halo's visible band as
// `(6.0 - icon-halo-width * scaleFactor / icon-size) / SDF_PX` — once `icon-halo-width` exceeds
// roughly `6 * icon-size`, that goes negative and the *entire* icon quad (not just a ring) paints
// solid `icon-halo-color`, not just at `to` but for every frame past that point in the ramp. This
// is a fixed relationship in the shader, independent of the image's own resolution/`sdf` `radius`
// (see `Image`'s SDF notes) — it only cares about the `icon-halo-width`/`icon-size` paint values.
// `4` stays under that ceiling through the whole ramp for `icon-size` down to `~0.67`; scale it
// down further (or scale `icon-size` up) for smaller icons.
const PULSE_DEFAULTS = {
  property: "icon-halo-width",
  from: 0,
  to: 4,
  duration: 1500,
  waveform: "out",
} as const satisfies Required<PulseConfig>;

// Tailwind's own `animate-ping` keyframes reach their end state at 75% of the cycle and hold
// there for the remaining 25% before the animation repeats (an abrupt reset, not a smooth
// return) — matched here so `"out"`/`"in"` look identical to the familiar CSS animation.
const PULSE_RAMP_FRACTION = 0.75;
const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

// Resolves a `duration`-relative elapsed time to a 0..1 progress value along one pulse cycle,
// independent of `from`/`to`/direction — `"in"` vs `"out"` is applied by the caller via which
// end of `[from, to]` it lerps towards, not by a different shape here.
const pulseShape = (
  elapsed: number,
  duration: number,
  waveform: PulseConfig["waveform"],
): number => {
  const phase = (elapsed % duration) / duration;
  if (waveform === "in-out") return (1 - Math.cos(phase * Math.PI * 2)) / 2;
  const ramp = Math.min(phase / PULSE_RAMP_FRACTION, 1);
  return easeOutQuad(ramp);
};

const lerpColor = (
  from: [number, number, number, number],
  to: [number, number, number, number],
  t: number,
): string => {
  const r = Math.round(from[0] + (to[0] - from[0]) * t);
  const g = Math.round(from[1] + (to[1] - from[1]) * t);
  const b = Math.round(from[2] + (to[2] - from[2]) * t);
  const a = from[3] + (to[3] - from[3]) * t;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

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
  /** Continuously animates one paint property via `setPaintProperty` every animation frame —
   *  e.g. a growing/fading `icon-halo-width`/`icon-halo-color` for a "pulsing dot" marker. Every
   *  field defaults (see `PulseConfig`), so `pulse` alone or `pulse={{}}` already pulses a
   *  symbol layer's halo — override only what you need to customize. Pass an array to drive
   *  several properties at once (one shared `requestAnimationFrame` loop), e.g. `icon-halo-width`
   *  and `icon-opacity` together for a combined ping. Driven by real paint properties (not a
   *  swapped-out image), so it composes with any other paint value, including data-driven
   *  expressions on other properties of the same layer. */
  pulse?: boolean | PulseConfig | PulseConfig[];
  children?: any;
  /** Any content that should be rendered within the layer. */
} & layerEventTypes;

const newKey = (key, type) =>
  (key.startsWith(type) || key.startsWith("icon") || key.startsWith("text")
    ? ""
    : type + "-") + key.replace(/[A-Z]/g, (s) => "-" + s.toLowerCase());

// `<Layer>` prop names that belong at the top level (as a `Props` field), not inside `style` —
// easy to mistype since some of them (`slot`, `visible`) read like style-ish concepts. None of
// these are in `baseStyle`, so without this check they'd silently fall through `updateStyle`'s
// bucketing into a bogus paint property (e.g. a `style={{ slot: 'top' }}` typo becomes a
// `circle-slot`/`symbol-slot` paint property mapbox-gl just ignores) instead of erroring.
const misplacedTopLevelProps = ["slot", "filter", "visible", "beforeId", "beforeType"];

// Lets paint colors be given as a Tailwind palette name (`fillColor: 'blue-600'`) or a CSS Color 4
// function Mapbox can't parse (`fillColor: 'oklch(54.6% 0.245 262.881)'`), alongside any format
// Mapbox already understands — see `resolveColorValue` in `./colors.ts`.
const resolveColor = (key: string, value: any): any => {
  if (!key.endsWith("color")) return value;
  if (Array.isArray(value)) return value.map((v) => resolveColor(key, v));
  return typeof value === "string" ? resolveColorValue(value) : value;
};

const constantRef = /^@(.+)$/;

// Resolves a `"@name"` reference against the `constants` prop passed to `<MapGL>` (see
// `MapProvider`'s `ctx.constants`) — the JS-side equivalent of the `@name`/`constants` feature the
// Mapbox GL style spec itself dropped after v7. Reads `constants[name]` directly (rather than e.g.
// `in`/`hasOwnProperty`) so a plain property access on the `solid-js/store` proxy is what
// establishes the reactive dependency, letting a `constants` prop change re-run just the Layer
// effects that reference the changed name. Recurses into Mapbox expression arrays (e.g.
// `["case", cond, "@hoverFill", CIRCLE_COLOR]`) so a constant can be used anywhere inside an
// expression, not just as a paint/layout property's entire value — a bare `"@name"` string is the
// only leaf ever swapped, since a real expression operator/argument never matches `constantRef`.
const resolveConstant = (
  key: string,
  value: any,
  constants: Record<string, any>,
  debug: (text: string, value?: any) => void,
): any => {
  if (Array.isArray(value))
    return value.map((v) => resolveConstant(key, v, constants, debug));
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
      if (misplacedTopLevelProps.includes(key))
        debug(
          `"${key}" is a <Layer> prop, not a style property — belongs outside "style", not inside it. Treating it as a paint/layout property instead.`,
        );
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
      // `slot` is Mapbox Standard-Style-only — MapLibre has no equivalent (see .claude/dev-notes.md)
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
        if (event === "click") evt.clickOnLayer = true;
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
    // needed to re-probe any "bg-x dark:bg-y" color pair (see resolveColor in ./colors.ts): the
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

  // Update Filter — independent from style.filter. Once props.filter has actually been used, a
  // later falsy value must still clear it (e.g. toggling every excluded value back on collapses
  // combineFilters() back to undefined) — only the never-used case is left alone, so layers that
  // rely on style.filter instead aren't clobbered by this effect running on mount.
  //
  // No isStyleLoaded()/styledata gating here (unlike the old version of this effect) — the layer
  // is always already on the map by the time this runs (addLayer above is synchronous, unguarded),
  // so setFilter is safe immediately, same as the ungated setFilter in the "Update Style" effect
  // above for style.filter. Gating on isStyleLoaded() was actively harmful: under Mapbox Standard's
  // continuous background asset streaming, isStyleLoaded() can read false for extended idle
  // stretches with no further "styledata" event to resolve the `await` — sibling <Layer>s in the
  // same reactive flush (e.g. PatientLayer.tsx's pulse + circle layers, both filtered off the same
  // hiddenUrgencyLevels signal) would each hit this gate, and whichever one's `await` won the race
  // could end up stuck for a minute or more, until some unrelated later styledata event happened to
  // resolve it — symptom: re-enabling the last hidden urgency level appeared to do nothing on the
  // map, sometimes indefinitely.
  createEffect((prev: FilterSpecification | undefined) => {
    if (props.filter === prev) return prev;
    if (prev === undefined && !props.filter) return prev;

    ctx.map.setFilter(layerId, props.filter ?? null);
    debug(`Update Filter (${layerId}):`, props.filter);
    return props.filter;
  }, undefined);

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

  // Pulse Animation
  createEffect(() => {
    if (!props.pulse) return;

    // `pulse` (bare) or `pulse={true}` is sugar for a single all-defaults config.
    const configs =
      props.pulse === true
        ? [{}]
        : Array.isArray(props.pulse)
          ? props.pulse
          : [props.pulse];
    // Colors are parsed to [r,g,b,a] once here rather than on every frame — reparsing would mean
    // re-running `resolveColor`'s DOM probe (Tailwind names/oklch/...) 60 times a second per
    // config. `"in"` is just `"out"` lerping the other direction, so `from`/`to` are swapped once
    // here rather than branched on inside the animation loop.
    const resolved = configs.map((config) => {
      const { property, from, to, duration, waveform } = {
        ...PULSE_DEFAULTS,
        ...config,
      };
      const isColor = typeof from === "string" || typeof to === "string";
      const [a, b] = waveform === "in" ? [to, from] : [from, to];
      return {
        property,
        duration,
        waveform,
        isColor,
        fromNum: isColor ? 0 : (a as number),
        toNum: isColor ? 0 : (b as number),
        fromRgba: isColor ? toRgbaComponents(a as string) : null,
        toRgba: isColor ? toRgbaComponents(b as string) : null,
      };
    });
    // Mapbox applies each paint property's own transition (default ~300ms ease) to every
    // setPaintProperty call, including the ones the loop below makes every frame. That's invisible
    // while ramping, since frame-to-frame deltas are tiny, but "out"/"in"'s reset is a big jump back
    // to the start of the cycle — without this, mapbox visibly eases that jump instead of snapping,
    // looking like an extra shrink/grow instead of a clean reset. Disabling the transition once, up
    // front, for whichever property is pulsed makes every waveform's reset instant.
    resolved.forEach((cfg) => {
      ctx.map.setPaintProperty(
        layerId,
        `${cfg.property}-transition` as any,
        { duration: 0, delay: 0 },
        { validate: false },
      );
    });

    const start = performance.now();
    let frameId: number;

    const loop = (now: number) => {
      const elapsed = now - start;
      resolved.forEach((cfg) => {
        const t = pulseShape(elapsed, cfg.duration, cfg.waveform);
        const value = cfg.isColor
          ? lerpColor(cfg.fromRgba!, cfg.toRgba!, t)
          : cfg.fromNum + (cfg.toNum - cfg.fromNum) * t;
        ctx.map.setPaintProperty(layerId, cfg.property as any, value, {
          validate: false,
        });
      });
      frameId = window.requestAnimationFrame(loop);
    };
    frameId = window.requestAnimationFrame(loop);
    debug(`Start Pulse (${layerId}):`, props.pulse);

    onCleanup(() => window.cancelAnimationFrame(frameId));
  });

  //Remove Layer
  onCleanup(() => ctx.map?.getLayer(layerId) && ctx.map?.removeLayer(layerId));

  return props.children;
};
