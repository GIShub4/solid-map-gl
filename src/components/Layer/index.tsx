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
import { resolveColor as resolveColorValue } from "./colors";
import type { layerEventTypes } from "../../lib/events";
import type { FilterSpecification, CustomLayerInterface } from "mapbox-gl";

// `style` accepts a mix of base layer keys (`type`, `filter`, `minzoom`/`maxzoom`,
// `source-layer`) and flat paint/layout properties (e.g. `fillColor` or `fill-color`), which
// `updateStyle()` buckets into real `paint`/`layout` objects — never a literal `LayerSpecification`
// or `StyleSpecification`, so those mapbox-gl types don't actually describe this shape.
type FlatLayerStyle = Record<string, any>;

type PulseConfig = {
  /** The paint property to animate — a number (e.g. `"circle-radius"`, `"icon-halo-width"`) or a
   *  `*-color` property (e.g. `"circle-color"`, `"icon-halo-color"`) to fade/shift a color. No
   *  default: which property makes sense depends entirely on the layer type, so this is required. */
  property: string;
  /** Value at the start of each ping — a number, or any CSS color string (hex, named, rgb/rgba, a
   *  Tailwind name, oklch(), ...) when animating a `*-color` property. */
  from: number | string;
  /** Value the ping ramps out to before holding and resetting. */
  to: number | string;
  /** Full cycle length, in ms: ramp-out, then hold at `to`, then reset. Default `1500`. */
  duration?: number;
  /** Fraction of `duration` spent held at `to` before the next reset (the remainder is the ramp).
   *  Default `0.25`, matching Tailwind's `animate-ping` timing. */
  holdFraction?: number;
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
  /** A periodic "ping": each cycle resets to `from`, hands the ramp to `to` off to Mapbox's own
   *  paint-property transition, then holds at `to` until the next cycle — e.g. a growing/fading
   *  `circle-radius`/`circle-color` for a "pulsing dot" marker. Pass an array to drive several
   *  properties off one shared cycle (one `setInterval` per entry, all started together), e.g.
   *  `circle-radius` and `circle-color` together for a ring that grows *and* fades. Driven by real
   *  paint properties (not a swapped-out image), so it composes with any other paint value,
   *  including data-driven expressions on other properties of the same layer.
   *
   *  Only touches the property twice per cycle (reset + ramp-start) — the ramp itself is animated
   *  by Mapbox, not a per-frame `setPaintProperty` loop — so between the ramp finishing and the
   *  next cycle's reset, the map genuinely goes idle instead of staying marked dirty forever. That
   *  matters beyond just performance: `@mapbox/mapbox-gl-draw`'s own mount logic and this
   *  library's `captureWhenSettled()`/`waitUntilSettled()` both depend on the map actually
   *  reaching `'idle'`/`loaded()` — a continuously-dirty map silently starves both. */
  pulse?: PulseConfig | PulseConfig[];
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

  // setPaintProperty/setLayoutProperty/setFilter/setLayerZoomRange/moveLayer — unlike addLayer,
  // which tolerates an in-progress style — throw "Style is not done loading" if they land while a
  // style swap is mid-flight (MapGL's own style-swap effect tears down and reloads the style
  // synchronously). That's a narrow, self-resolving window: the swap finishes shortly after, and
  // whatever triggered this call (a prop change, a timer tick) either already has, or will soon
  // get, another chance to reapply — so it's swallowed here rather than left to crash the whole
  // reactive flush/animation frame it happened to run on. Anything else rethrows; this isn't a
  // general error suppressor, just a fix for this one well-understood race.
  const ignoringUnloadedStyle = (fn: () => void) => {
    try {
      fn();
    } catch (err) {
      if (!(err instanceof Error) || err.message !== "Style is not done loading") throw err;
      debug(`Skipped map update (${layerId}) — style mid-swap`);
    }
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
      // props.filter (independent from style.filter — see the "Update Filter" effect below) takes
      // the same precedence here it takes there, so a filter provided at mount is fully in place
      // from this one addLayer call instead of needing a follow-up setFilter — see that effect's
      // own comment for why a redundant one is unsafe when a <Layer> mounts mid-style-swap.
      ...(props.filter !== undefined ? { filter: props.filter } : {}),
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
  // The addLayer() call above already passed style.paint/layout/filter/minzoom/maxzoom as part of
  // the layer spec itself (see baseStyle in ./styles.ts — paint/layout/filter/minzoom/maxzoom are
  // all in it), so this effect's own first run has nothing left to apply: skip it rather than
  // re-deriving the identical values through setPaintProperty/setLayoutProperty/setFilter calls
  // that require the style to already be loaded. Without this, a <Layer> that mounts in the same
  // reactive tick as a style swap (e.g. a <Show> gated on the same flag that also drives the base
  // style URL) hit "Style is not done loading" here even though addLayer — which tolerates an
  // in-progress style — had just succeeded moments earlier.
  let isFirstStyleUpdate = true;
  createEffect((prev: FlatLayerStyle) => {
    // Read (not otherwise used) so any environment change MapGL noticed (a matchMedia firing, or
    // any attribute mutation on <html>/<body> — not just a "dark" class) re-runs this effect,
    // needed to re-probe any "bg-x dark:bg-y" color pair (see resolveColor in ./colors.ts): the
    // browser's cascade decides which of the two applies, but nothing tells Solid to re-read that
    // cascade on its own, so this stands in as the "please re-check" trigger.
    ctx.themeVersion;
    const style = updateStyle(props.style, ctx.constants, debug);
    if (isFirstStyleUpdate) {
      isFirstStyleUpdate = false;
      return style;
    }
    if (style === prev) return;

    if (style.layout !== prev?.layout)
      diff(style.layout, prev?.layout).forEach(([key, value]) =>
        ignoringUnloadedStyle(() =>
          ctx.map.setLayoutProperty(layerId, key as any, value, { validate: false }),
        ),
      );

    if (style.paint !== prev?.paint)
      diff(style.paint, prev?.paint).forEach(([key, value]) =>
        ignoringUnloadedStyle(() =>
          ctx.map.setPaintProperty(layerId, key as any, value, { validate: false }),
        ),
      );

    if (style.minzoom !== prev?.minzoom || style.maxzoom !== prev?.maxzoom)
      ignoringUnloadedStyle(() => ctx.map.setLayerZoomRange(layerId, style.minzoom, style.maxzoom));

    if (style.filter !== prev?.filter)
      ignoringUnloadedStyle(() => ctx.map.setFilter(layerId, style.filter, { validate: false }));

    debug("Update Layer Style:", layerId);
    return style;
  }, updateStyle(props.style, ctx.constants, debug));

  // Update Visibility
  createEffect((prev: boolean) => {
    if (props.visible === prev) return;

    ignoringUnloadedStyle(() =>
      ctx.map.setLayoutProperty(
        layerId,
        "visibility",
        props.visible ? "visible" : "none",
        { validate: false },
      ),
    );
    debug(`Update Visibility (${layerId}):`, props.visible.toString());
    return props.visible;
  }, props.visible);

  // Update Layer Z-Index
  createEffect((prev: string) => {
    if (getBeforeId() === prev) return prev;

    ignoringUnloadedStyle(() => ctx.map.moveLayer(layerId, getBeforeId()));
    debug(`Update Layer Z-Index (${layerId}):`, getBeforeId());
    return getBeforeId();
  }, getBeforeId());

  // Update Filter — independent from style.filter. Once props.filter has actually been used, a
  // later falsy value must still clear it (e.g. toggling every excluded value back on collapses
  // combineFilters() back to undefined) — only the never-used case is left alone, so layers that
  // rely on style.filter instead aren't clobbered by this effect running on mount.
  //
  // Seeded with props.filter (not a hardcoded undefined) so a filter already provided at mount —
  // now also passed straight into addLayer() above — makes this effect's own first run a no-op
  // for the common case of a static filter prop (reference-equal on that first read). That matters
  // because setFilter, unlike addLayer, throws "Style is not done loading" against a style that's
  // mid-swap — exactly the situation a <Layer> mounted from a <Show> gated on the same flag driving
  // the base style (e.g. RoadNetworkLayer.tsx, gated on mapStore.satellite) can land in. A
  // reactive filter expression (e.g. ProvinceLayer.tsx's, which re-derives a new array from
  // mapStore.activeProvinceId on every read) still isn't reference-equal on that first read, so it
  // still re-applies via setFilter here — acceptable since ProvinceLayer isn't conditionally mounted
  // on the same flag that swaps styles, so it isn't the case this is guarding against.
  //
  // Deliberately no isStyleLoaded()/styledata gating here — that was actively harmful: under Mapbox
  // Standard's continuous background asset streaming, isStyleLoaded() can read false for extended
  // idle stretches with no further "styledata" event to resolve an `await` on it — sibling <Layer>s
  // in the same reactive flush (e.g. PatientLayer.tsx's pulse + circle layers, both filtered off the
  // same hiddenUrgencyLevels signal) would each hit that gate, and whichever one's `await` won the
  // race could end up stuck for a minute or more, until some unrelated later styledata event
  // happened to resolve it — symptom: re-enabling the last hidden urgency level appeared to do
  // nothing on the map, sometimes indefinitely.
  createEffect((prev: FilterSpecification | undefined) => {
    if (props.filter === prev) return prev;
    if (prev === undefined && !props.filter) return prev;

    ignoringUnloadedStyle(() => ctx.map.setFilter(layerId, props.filter ?? null));
    debug(`Update Filter (${layerId}):`, props.filter);
    return props.filter;
  }, props.filter);

  // Update Feature State — same isStyleLoaded()/styledata trap the "Update Filter" effect above
  // used to have (see its comment): removeFeatureState/setFeatureState call _checkLoaded() just
  // like setFilter does, so this used to gate on `!ctx.map.isStyleLoaded() && (await
  // ctx.map.once("styledata"))` — and under Mapbox Standard's continuous background asset
  // streaming, isStyleLoaded() can read false for extended idle stretches with no further
  // "styledata" event to resolve that await, so a hover effect (e.g. ProvinceLayer.tsx's, which
  // recreates its featureState prop on every mapStore.hoveredProvinceId change) could get stuck for
  // a minute or more — symptom: hovering a province appeared to do nothing, sometimes indefinitely.
  // ignoringUnloadedStyle replaces it: if the style is genuinely mid-swap this one hover update is
  // dropped, but the very next mouse-move recomputes featureState and retries — nothing to hang on.
  createEffect(() => {
    if (!props.featureState || props.featureState.id === null) return;

    ignoringUnloadedStyle(() => {
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
  });

  // Pulse Animation — see `PulseConfig`'s doc comment above for why this is a periodic
  // reset/ramp/hold cycle (driven by Mapbox's own paint-property transition) rather than a
  // per-frame `setPaintProperty` loop.
  createEffect(() => {
    if (!props.pulse) return;
    const configs = Array.isArray(props.pulse) ? props.pulse : [props.pulse];

    const timers = configs.map((config) => {
      const { property, duration = 1500, holdFraction = 0.25 } = config;
      // Resolved once here (Tailwind name/oklch/... normalization), not on every beat — reuses
      // the same `resolveColor` every other paint value on this layer already goes through, and
      // is a no-op for a plain numeric property (see `resolveColor`'s own `!key.endsWith("color")`
      // early-out above).
      const from = resolveColor(property, config.from);
      const to = resolveColor(property, config.to);
      const rampMs = duration * (1 - holdFraction);

      const beat = () => {
        // Snap back to `from` with no transition, instant.
        ignoringUnloadedStyle(() => {
          ctx.map.setPaintProperty(layerId, `${property}-transition` as any, { duration: 0, delay: 0 }, { validate: false });
          ctx.map.setPaintProperty(layerId, property as any, from, { validate: false });
        });
        // ...then, one real frame later, hand the ramp to Mapbox's own transition system. The gap
        // matters: mapbox-gl-js only treats a paint-property change as a transition's starting
        // point once it's actually been rendered — two `setPaintProperty` calls in the same tick
        // would just collapse into the second value, and `from` would never visibly render.
        //
        // Guarded the same as above: this timer runs indefinitely (every `duration` ms) for as
        // long as the layer is pulsing, entirely independent of any one style swap — a click that
        // mounts a newly-pulsing layer (e.g. HealthFacilityLayer.tsx selecting a facility) can land
        // a beat mid-swap with no relation to component mount timing at all, and unlike a one-time
        // mount race, waiting costs nothing here: the next beat, one cycle later, just retries.
        requestAnimationFrame(() => {
          ignoringUnloadedStyle(() => {
            ctx.map.setPaintProperty(layerId, `${property}-transition` as any, { duration: rampMs, delay: 0 }, { validate: false });
            ctx.map.setPaintProperty(layerId, property as any, to, { validate: false });
          });
        });
      };

      beat();
      return window.setInterval(beat, duration);
    });
    debug(`Start Pulse (${layerId}):`, props.pulse);

    onCleanup(() => timers.forEach((timer) => window.clearInterval(timer)));
  });

  //Remove Layer
  onCleanup(() => ctx.map?.getLayer(layerId) && ctx.map?.removeLayer(layerId));

  return props.children;
};
