import {
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  Component,
  on,
} from "solid-js";
import { MapProvider } from "../MapProvider";
import { mapEvents } from "../../events";
import { vectorStyleList } from "../../mapStyles";
import type { mapEventTypes } from "../../events";
import type mapboxgl from "mapbox-gl";
import type {
  MapboxOptions,
  LngLatLike,
  LngLatBounds,
  PaddingOptions,
  StyleSpecification,
} from "mapbox-gl";
import type { JSX } from "solid-js";

export type Map = mapboxgl.Map & {
  debug: boolean;
  debugEvents: boolean;
  sourceIdList: string[];
  layerIdList: string[];
  /** Whether this map instance is backed by MapLibre GL JS rather than Mapbox GL JS */
  isMapLibre: boolean;
};

export type Viewport = {
  id?: string;
  point?: { x: number; y: number };
  center?: LngLatLike;
  bounds?: LngLatBounds;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  padding?: PaddingOptions;
  inTransit?: boolean;
};

type Props = {
  /** ID for the map container element */
  id?: string;
  /** Map Container CSS Style */
  style?: JSX.CSSProperties;
  /** Map Container CSS Class */
  class?: string;
  /** SolidJS Class List for Map Container */
  classList?: {
    [k: string]: boolean | undefined;
  };
  /** Current Map View */
  viewport?: Viewport;
  /** Mapbox Options
   * @see https://docs.mapbox.com/mapbox-gl-js/api/map/#map-parameters
   */
  options?: MapboxOptions;
  /** Mapbox Standard / Standard Satellite style configuration — Mapbox-only, no-op on MapLibre.
   * @see https://docs.mapbox.com/mapbox-gl-js/guides/styles/#configure-a-style
   */
  config?: {
    id?: string;
    lightPreset?: "dawn" | "day" | "dusk" | "night" | string;
    showPlaceLabels?: boolean;
    showRoadLabels?: boolean;
    showPointOfInterestLabels?: boolean;
    showTransitLabels?: boolean;
    showRoadsAndTransit?: boolean;
    showLandmarkIcons?: boolean;
    showLandmarkIconLabels?: boolean;
    showPedestrianRoads?: boolean;
    show3dObjects?: boolean;
    show3dBuildings?: boolean;
    show3dTrees?: boolean;
    show3dLandmarks?: boolean;
    show3dFacades?: boolean;
    showAdminBoundaries?: boolean;
    showIndoor?: boolean;
    showIndoorLabels?: boolean;
    theme?: "default" | "faded" | "monochrome" | "custom" | string;
    themeData?: string;
    colorModePointOfInterestLabels?: "default" | "single" | string;
    backgroundPointOfInterestLabels?: "circle" | "none" | string;
    densityPointOfInterestLabels?: 1 | 2 | 3 | 4 | 5 | number;
    fuelingStationModePointOfInterestLabels?: string;
    colorPlaceLabels?: string;
    colorRoadLabels?: string;
    colorCommercial?: string;
    colorEducation?: string;
    colorMedical?: string;
    colorIndustrial?: string;
    colorGreenspace?: string;
    colorWater?: string;
    colorLand?: string;
    colorAdminBoundaries?: string;
    colorPointOfInterestLabels?: string;
    colorMotorways?: string;
    colorTrunks?: string;
    colorRoads?: string;
    colorBuildings?: string;
    colorBuildingHighlight?: string;
    colorBuildingSelect?: string;
    colorPlaceLabelHighlight?: string;
    colorPlaceLabelSelect?: string;
    colorIndoorLabelSelect?: string;
    colorIndoorLabelHighlight?: string;
    font?: string[];
    [key: string]: boolean | string | number | string[];
  };
  /** Type for pan, move and zoom transitions */
  transitionType?: "flyTo" | "easeTo" | "jumpTo" | string;
  /** Event listener for Viewport updates */
  onViewportChange?: (viewport: Viewport) => void;
  /** Event listener for User Interaction */
  onUserInteraction?: (user: boolean) => void;
  /** Displays Map Tile Borders */
  showTileBoundaries?: boolean;
  /** Displays Wireframe if Terrain is visible */
  showTerrainWireframe?: boolean;
  /** Displays Borders if Padding is set */
  showPadding?: boolean;
  /** Displays Label Collision Boxes */
  showCollisionBoxes?: boolean;
  /** Displays all feature outlines even if normally not drawn by style rules */
  showOverdrawInspector?: boolean;
  /** Mouse Cursor Style */
  cursorStyle?: string;
  //** Dark Map Style */
  darkStyle?: StyleSpecification | string;
  /** Called with (prevStyle, nextStyle) on every base style change. Return false to skip
   * mapbox-gl's diff attempt and go straight to a full rebuild — useful when you already know a
   * given style pair can never diff (e.g. Standard vs Standard Satellite, whose sprite/glyphs
   * always differ), to avoid the wasted diff pass and its "Unimplemented ... Rebuilding the style
   * from scratch" console warnings. Defaults to always attempting the diff (mapbox-gl's own
   * default), so existing consumers see no behavior change unless they opt in. */
  shouldDiffStyle?: (prevStyle: any, nextStyle: any) => boolean;
  //** Disable automatic map resize */
  disableResize?: boolean;
  //** MapLibre library */
  mapLib?: any;
  //** APIkey for vector service */
  apikey?: string;
  //** Debug Message Mode */
  debug?: boolean;
  //** Debug Events */
  debugEvents?: boolean;
  ref?: HTMLDivElement;
  /** Children within the Map Container */
  children?: any;
} & mapEventTypes;

/** Creates a new Map Container */
export const MapGL: Component<Props> = (props) => {
  let map: Map;
  let mapRef: HTMLDivElement;
  let resizeObserver: ResizeObserver;
  let mutationObserver: MutationObserver;
  let mapLib: any;
  let isMapLibre = false;

  const [mapLoaded, setMapLoaded] = createSignal(null);
  const [darkMode, setDarkMode] = createSignal(
    (typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches) ||
      (typeof document !== "undefined" &&
        document.body.classList.contains("dark")),
  );
  // Set around map.stop() so the moveend it synchronously fires for a
  // cancelled in-flight ease doesn't echo back into onViewportChange —
  // that echo re-enters the viewport effect below before it returns.
  let interruptingEase = false;
  // Set immediately before every move/moveend-triggered onViewportChange call and consumed by
  // the viewport effect below. A typical consumer writes onViewportChange's argument straight
  // back into the same store field this effect reads (e.g. `setStore({ viewport: evt })`), which
  // re-triggers the effect synchronously — this flag is how it recognizes that inbound change as
  // its own outbound call's echo (skip) rather than a genuinely new target (act on it right
  // away, even mid-flight). This is deliberately NOT based on comparing viewport values: a
  // consumer's own update handler (e.g. "spread the previous viewport, override just `bounds`")
  // routinely carries fields from our last echo forward into what is otherwise a brand-new
  // request, so tagging/comparing the data itself is unreliable — tracking the round-trip
  // transactionally, independent of what the consumer's store does to the data, is not.
  let expectingOwnEcho = false;

  const debug = (text: string, value?: any) =>
    (props.debug || props.debugEvents) &&
    console.debug("%c[MapGL]", "color: #0ea5e9", text, value || "");

  const getStyle = (light: any, dark: any) => {
    const style = darkMode() && dark ? dark : light;
    return typeof style === "string" || style instanceof String
      ? style
          ?.split(":")
          .reduce((p: any, c) => p && p[c], vectorStyleList)
          ?.replace(
            "{apikey}",
            //@ts-ignore
            props.apikey || import.meta.env?.VITE_VECTOR_API_KEY,
          ) || style
      : style;
  };

  onMount(async () => {
    mapLib = props.mapLib || (await import("mapbox-gl"));
    if (!mapLib.Map) mapLib = window["maplibregl"] || window["mapboxgl"];

    if (typeof mapLib.supported === "function" && !mapLib.supported())
      throw new Error("Mapbox GL not supported");

    // Mapbox Standard Style's setConfigProperty is Mapbox-only — its absence is a stable,
    // structural way to tell the two libraries apart regardless of how mapLib was obtained.
    isMapLibre = typeof mapLib.Map?.prototype?.setConfigProperty !== "function";

    debug(`Map (v${mapLib.version}) loading...`);
    map = new mapLib.Map({
      accessToken:
        props.options?.accessToken ||
        //@ts-ignore
        import.meta.env?.VITE_MAPBOX_ACCESS_TOKEN,
      interactive: props.options?.interactive || !!props.onViewportChange,
      ...props.options,
      ...props.viewport,
      projection: props.options?.projection,
      container: mapRef,
      style: getStyle(props.options?.style, props.darkStyle),
      fitBoundsOptions: { padding: props.viewport?.padding },
    } as MapboxOptions);

    map.debug = props.debug;
    map.debugEvents = props.debugEvents;
    map.sourceIdList = [];
    map.layerIdList = [];
    map.isMapLibre = isMapLibre;

    // Hook up events
    mapEvents.forEach((item) => {
      const prop = props[item];
      if (prop) {
        const event = item.slice(2).toLowerCase();
        if (typeof prop === "function") {
          map.on(event as any, (evt) => {
            setTimeout(() => {
              if ((evt as any).clickOnLayer) return;
              prop(evt);
              props.debugEvents && debug(`Map '${event}' event:`, evt);
            }, 0);
          });
        } else {
          Object.keys(prop).forEach((layerId) => {
            map.on(event as any, layerId, (evt) => {
              setTimeout(() => {
                if ((evt as any).clickOnLayer) return;
                prop[layerId](evt);
                props.debugEvents &&
                  debug(`Map '${event}' event on '${layerId}':`, evt);
              }, 0);
            });
          });
        }
      }
    });

    map.once("load", () => {
      setMapLoaded(map);
      debug("Map loaded");

      // Handle User Interaction
      ["mousedown", "touchstart", "wheel"].forEach((event) =>
        map.on(
          event as any,
          (evt: any) => !evt.rotate && props.onUserInteraction?.(true),
        ),
      );
      ["moveend", "mouseup", "touchend"].forEach((event) =>
        map.on(
          event as any,
          (evt: any) => !evt.rotate && props.onUserInteraction?.(false),
        ),
      );

      // Listen to dark theme changes
      const darkTheme =
        typeof window !== "undefined" &&
        window?.matchMedia("(prefers-color-scheme: dark)");
      darkTheme?.addEventListener("change", () => {
        setDarkMode(darkTheme.matches);
        debug("Set dark theme to:", darkTheme.matches?.toString());
      });
      mutationObserver = new MutationObserver(() => {
        const darkTheme = document.body.classList.contains("dark");
        setDarkMode(darkTheme);
        debug("Set theme to:", darkTheme);
      });
      mutationObserver.observe(document.body, { attributes: true });

      // Listen to map container size changes
      if (!props.disableResize) {
        resizeObserver = new ResizeObserver(() => {
          setTimeout(() => {
            map?.resize();
          }, 0);
          debug("Map resized");
        });
        resizeObserver.observe(mapRef as Element);
      }

      // Update Viewport
      map.on("move", (event) => {
        const viewport: Viewport = {
          ...props.viewport,
          id: props.id,
          point: {
            x: (event as any).originalEvent?.x,
            y: (event as any).originalEvent?.y,
          },
          center: (props.viewport?.center as any)?.lat
            ? map.getCenter()
            : [map.getCenter().lng, map.getCenter().lat],
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
          inTransit: true,
          bounds: null,
          //   !internal()
          //     ? props.viewport?.center?.lat
          //       ? map.getBounds()
          //       : [
          //           [
          //             map.getBounds().getNorthEast().lng,
          //             map.getBounds().getNorthEast().lat,
          //           ],
          //           [
          //             map.getBounds().getSouthWest().lng,
          //             map.getBounds().getSouthWest().lat,
          //           ],
          //         ]
          //     : null,
        };
        if (!(event as any).viewport && props.onViewportChange) {
          expectingOwnEcho = true;
          props.onViewportChange(viewport);
        }
      });

      map.on("moveend", (event: any) => {
        if (interruptingEase) return;
        if (event.rotate) return;
        if (!props.onViewportChange) return;
        const viewport: Viewport = { ...props.viewport, inTransit: false };
        expectingOwnEcho = true;
        props.onViewportChange(viewport);
      });
    });
  });

  // Hook up viewport event
  createEffect(
    on(
      () => props.viewport,
      (vp: any) => {
        if (props.id !== vp?.id) return;
        // If we're currently expecting our own move/moveend echo to come back through
        // props.viewport, this change is it — consume the flag and ignore it. Anything else is
        // a genuinely new request and should interrupt whatever's in flight right away.
        if (expectingOwnEcho) {
          expectingOwnEcho = false;
          return;
        }
        const viewport = {
          ...vp,
          ...(vp.bounds
            ? map.cameraForBounds(vp.bounds, {
                bearing: vp?.bearing,
                pitch: vp?.pitch,
                padding: vp?.padding,
              })
            : null),
        };
        interruptingEase = true;
        map.stop();
        interruptingEase = false;
        map[props.transitionType || "flyTo"](viewport);
        debug(
          `Update Viewport (${props.transitionType || "flyTo"}):`,
          viewport,
        );
      },
      { defer: true },
    ),
  );

  // Update Configuration
  createEffect(() => {
    // Tracks mapLoaded() (rather than reading the plain `map` variable) so this effect re-runs
    // once the map finishes loading, correctly applying an initially-provided config — setting
    // config properties requires the style to already be loaded, which is why this can't just
    // run at construction time like most other options.
    const loadedMap = mapLoaded() as any;
    if (typeof loadedMap?.setConfigProperty !== "function") {
      if (loadedMap && props.config && Object.keys(props.config).length) {
        debug(
          "Config prop is set but this map library has no setConfigProperty (Mapbox Standard Style only) — skipping",
        );
      }
      return;
    }
    for (const key in props.config) {
      if (!key || key === "id") continue;
      const id = props.config?.id || "basemap";
      const value = props.config[key];
      loadedMap.setConfigProperty(id, key, value);
      debug(`Set Config (${id}:${key}) to:`, value);
    }
  });

  // Update Projection
  createEffect(() => {
    const proj = props.options?.projection;
    if (!map || !proj) return;
    map.setProjection(proj);
    debug("Set Projection to:", proj);
  });

  // Update Cursor
  createEffect(() => {
    const cur = props.cursorStyle;
    if (!map || !cur) return;
    map.getCanvas().style.cursor = cur;
    debug("Set Cursor to:", cur);
  });

  const insertLayers = (list, layers) => {
    layers.forEach((layer) => {
      const index = list.findIndex((i) =>
        layer.metadata.smg.beforeType
          ? i.type === layer.metadata.smg.beforeType
          : i.id === layer.metadata.smg.beforeId,
      );
      list =
        index === -1
          ? [...list, layer]
          : [...list.slice(0, index), layer, ...list.slice(index)];
    });
    return list;
  };

  // Update map style
  createEffect((prev) => {
    const style = getStyle(props.options?.style, props.darkStyle);
    if (map?.isStyleLoaded() && prev !== style) {
      const oldStyle = map.getStyle();
      const oldLayers = oldStyle.layers.filter((l) =>
        map.layerIdList.includes(l.id),
      );
      const oldSources = Object.keys(oldStyle.sources)
        .filter((s) => map.sourceIdList.includes(s))
        .reduce((obj, key) => ({ ...obj, [key]: oldStyle.sources[key] }), {});

      const diff = props.shouldDiffStyle ? props.shouldDiffStyle(prev, style) : true;
      // mapbox-gl's SetStyleOptions type marks localFontFamily/localIdeographFontFamily as
      // required even though they're optional at runtime — cast to sidestep that upstream typing gap.
      map.setStyle(style, diff ? undefined : ({ diff: false } as any));
      map.once("styledata", () => {
        if (!oldLayers) return;
        const newStyle = map.getStyle();
        map.setStyle({
          ...newStyle,
          sources: { ...newStyle.sources, ...oldSources },
          layers: insertLayers(newStyle.layers, oldLayers),
          fog: oldStyle.fog,
          terrain: oldStyle.terrain,
          light: oldStyle.light,
        });
        debug("Set Mapstyle to:", style);
      });
    }
    return style;
  }, props.options?.style);

  // Update debug features
  [
    "showTileBoundaries",
    "showTerrainWireframe",
    "showCollisionBoxes",
    "showPadding",
    "showOverdrawInspector",
  ].forEach((item) => {
    createEffect(() => {
      const prop = props[item];
      if (!map || !prop) return;
      map[item] = prop;
      debug(`Set ${item} to:`, prop);
    });
  });

  onCleanup(() => {
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    map?.remove();
    debug("Map removed");
  });

  return (
    <div
      ref={mapRef}
      id={props.id}
      class={props?.class}
      classList={props?.classList}
      style={{ width: "100%", height: "100%", ...props.style }}
    >
      {mapLoaded() && (
        <MapProvider map={mapLoaded()} mapLib={mapLib} isMapLibre={isMapLibre}>
          <style>{`.overlay{position:relative;width:100%;height:100%;pointer-events:none}:where(.overlay>*){pointer-events:auto}`}</style>
          <div class="overlay">{props.children}</div>
        </MapProvider>
      )}
    </div>
  );
};
