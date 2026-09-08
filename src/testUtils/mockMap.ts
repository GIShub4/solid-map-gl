import { vi } from "vitest";

/**
 * Hand-rolled mock of the subset of the Mapbox/MapLibre `Map` API this library actually calls,
 * per UPGRADE_PLAN.md Section 7.1 (real third-party map mocks are unmaintained/dead). Built once,
 * reused across every component's test file — do not hand-roll a second mock elsewhere.
 */

type AnyFn = (...args: any[]) => any;

const key = (event: string, layerId?: string) =>
  layerId ? `${event}:${layerId}` : event;

export type MockMap = ReturnType<typeof createMockMap>;

/**
 * A real `mapboxgl.Map`/`maplibregl.Map` instance's prototype chain isn't a plain object, so
 * `solid-js/store`'s `createStore` treats it as an opaque leaf value and never recursively
 * proxies it — which is what lets components freely do `ctx.map.sourceIdList.push(...)`. A plain
 * object literal *would* get deep-proxied (and array mutations like `.push` would then throw
 * "Cannot mutate a Store directly"), so the mock is built on a real class instance to match.
 */
class MockMapInstance {}

export function createMockMap(opts: { isMapLibre?: boolean } = {}) {
  const isMapLibre = !!opts.isMapLibre;
  const listeners = new Map<string, Set<AnyFn>>();
  const sources = new Map<string, any>();
  const layers = new Map<string, any>();
  const controls = new Set<any>();
  const images = new Set<string>();

  let styleObj: any = { layers: [], sources: {}, fog: null, terrain: null, light: null };
  let sky: any = null;
  let fog: any = null;
  let light: any = null;
  let terrain: any = null;

  const on = vi.fn((event: string, a: any, b?: AnyFn) => {
    const handler = typeof a === "function" ? a : b;
    const k = typeof a === "function" ? event : key(event, a);
    if (!listeners.has(k)) listeners.set(k, new Set());
    listeners.get(k)!.add(handler);
    return map;
  });

  const off = vi.fn((event: string, a: any, b?: AnyFn) => {
    const handler = typeof a === "function" ? a : b;
    const k = typeof a === "function" ? event : key(event, a);
    listeners.get(k)?.delete(handler);
    return map;
  });

  const once = vi.fn((event: string, handler?: AnyFn) => {
    if (!handler) return Promise.resolve();
    const wrapped = (...args: any[]) => {
      off(event, wrapped);
      handler(...args);
    };
    on(event, wrapped);
    return map;
  });

  /** Test-only helper (not a real Mapbox signature): fire `event`, optionally scoped to a layer. */
  const fire = vi.fn((event: string, evt: any = {}, layerId?: string) => {
    listeners.get(key(event, layerId))?.forEach((h) => h(evt));
    return map;
  });

  const addSource = vi.fn((id: string, spec: any) => {
    sources.set(id, {
      ...spec,
      setData: vi.fn(),
      setUrl: vi.fn(),
      setTiles: vi.fn(),
      updateImage: vi.fn(),
    });
    return map;
  });
  const getSource = vi.fn((id: string) => sources.get(id));
  const removeSource = vi.fn((id: string) => sources.delete(id));
  const isSourceLoaded = vi.fn(() => true);

  const addLayer = vi.fn((layer: any, _beforeId?: string) => {
    layers.set(layer.id, layer);
    return map;
  });
  const getLayer = vi.fn((id: string) => layers.get(id));
  const removeLayer = vi.fn((id: string) => layers.delete(id));
  const setLayoutProperty = vi.fn();
  const setPaintProperty = vi.fn();
  const setLayerZoomRange = vi.fn();
  const setFilter = vi.fn();
  const setFeatureState = vi.fn();
  const removeFeatureState = vi.fn();

  const getStyle = vi.fn(() => styleObj);
  const setStyle = vi.fn((s: any) => {
    styleObj = typeof s === "string" ? { ...styleObj, styleUrl: s } : { ...styleObj, ...s };
    return map;
  });
  const isStyleLoaded = vi.fn(() => true);

  const addControl = vi.fn((c: any, _position?: string) => {
    controls.add(c);
    return map;
  });
  const removeControl = vi.fn((c: any) => {
    controls.delete(c);
    return map;
  });
  const hasControl = vi.fn((c: any) => controls.has(c));

  const hasImage = vi.fn((id: string) => images.has(id));
  const addImage = vi.fn((id: string, _data?: any, _opts?: any) => {
    images.add(id);
  });
  const removeImage = vi.fn((id: string) => images.delete(id));
  const updateImage = vi.fn();
  const triggerRepaint = vi.fn();
  /** Default: succeed asynchronously (next microtask, so `tick()` alone is enough to await it)
   *  with a 1x1 image, mirroring the real callback-only API. */
  const loadImage = vi.fn((_url: string, cb: (err: any, data?: any) => void) => {
    Promise.resolve().then(() => cb(null, { width: 1, height: 1, data: new Uint8Array(4) }));
  });

  const stop = vi.fn(() => map);
  const flyTo = vi.fn(() => map);
  const easeTo = vi.fn(() => map);
  const jumpTo = vi.fn(() => map);
  const resetNorthPitch = vi.fn(() => map);
  const resize = vi.fn(() => map);
  const remove = vi.fn();

  const map: any = Object.assign(new MockMapInstance(), {
    debug: false,
    debugEvents: false,
    sourceIdList: [] as string[],
    layerIdList: [] as string[],
    isMapLibre,

    on,
    off,
    once,
    fire,

    addSource,
    getSource,
    removeSource,
    isSourceLoaded,

    addLayer,
    getLayer,
    removeLayer,
    setLayoutProperty,
    setPaintProperty,
    setLayerZoomRange,
    setFilter,
    setFeatureState,
    removeFeatureState,

    getStyle,
    setStyle,
    isStyleLoaded,

    addControl,
    removeControl,
    hasControl,

    hasImage,
    addImage,
    removeImage,
    updateImage,
    loadImage,
    triggerRepaint,

    stop,
    flyTo,
    easeTo,
    jumpTo,
    resetNorthPitch,
    resize,
    remove,

    getCanvas: vi.fn(() => ({ style: {} })),
    getCenter: vi.fn(() => ({ lng: 0, lat: 0, toArray: () => [0, 0] })),
    getZoom: vi.fn(() => 0),
    getBearing: vi.fn(() => 0),
    getPitch: vi.fn(() => 0),
    getBounds: vi.fn(() => ({
      getNorthEast: () => ({ lng: 0, lat: 0 }),
      getSouthWest: () => ({ lng: 0, lat: 0 }),
    })),
    cameraForBounds: vi.fn(() => ({})),
    setProjection: vi.fn(),

    getFreeCameraOptions: vi.fn(() => ({ position: null, lookAtPoint: vi.fn() })),
    setFreeCameraOptions: vi.fn(),

    setLight: vi.fn((l: any) => {
      light = l;
    }),
    getLight: vi.fn(() => light),

    setTerrain: vi.fn((t: any) => {
      terrain = t;
    }),
    getTerrain: vi.fn(() => terrain),

    // Mapbox-only
    ...(isMapLibre
      ? {}
      : {
          setConfigProperty: vi.fn(),
          getConfigProperty: vi.fn(),
          setFog: vi.fn((f: any) => {
            fog = f;
          }),
          getFog: vi.fn(() => fog),
        }),

    // MapLibre-only
    ...(isMapLibre
      ? {
          setSky: vi.fn((s: any) => {
            sky = s;
          }),
          getSky: vi.fn(() => sky),
        }
      : {}),
  });

  return map;
}

/** Chainable Marker/Popup-shaped fake — every method returns `this` unless noted. Every
 *  constructed instance is pushed onto the class's own `instances` array so tests can grab
 *  "the popup/marker this render created" without threading extra plumbing through the mock. */
class MockPopup {
  static instances: MockPopup[] = [];
  options: any;
  open = false;
  constructor(options?: any) {
    this.options = options;
    MockPopup.instances.push(this);
  }
  on = vi.fn(() => this);
  off = vi.fn(() => this);
  addTo = vi.fn(() => {
    this.open = true;
    return this;
  });
  remove = vi.fn(() => {
    this.open = false;
    return this;
  });
  setHTML = vi.fn(() => this);
  setDOMContent = vi.fn(() => this);
  setLngLat = vi.fn(() => this);
  trackPointer = vi.fn(() => this);
  isOpen = vi.fn(() => this.open);
  toggle = vi.fn(() => {
    this.open = !this.open;
    return this;
  });
}

class MockMarker {
  static instances: MockMarker[] = [];
  options: any;
  popup: MockPopup | null = null;
  constructor(options?: any) {
    this.options = options;
    MockMarker.instances.push(this);
  }
  on = vi.fn(() => this);
  off = vi.fn(() => this);
  addTo = vi.fn(() => this);
  remove = vi.fn(() => this);
  setLngLat = vi.fn(() => this);
  setDraggable = vi.fn(() => this);
  setPopup = vi.fn((p: any) => {
    this.popup = p;
    return this;
  });
  getPopup = vi.fn(() => this.popup);
  togglePopup = vi.fn(() => {
    this.popup?.toggle();
    return this;
  });
  getLngLat = vi.fn(() => ({ lng: 0, lat: 0, toArray: () => [0, 0] }));
}

class MockControl {
  static instances: MockControl[] = [];
  options: any;
  constructor(options?: any) {
    this.options = options;
    MockControl.instances.push(this);
  }
}

/**
 * Fake `mapLib` module (the `mapbox-gl`/`maplibre-gl` export surface) — covers every class this
 * library reads off `ctx.mapLib`. `Map` is constructable and returns a `createMockMap()` instance,
 * so it doubles as the `props.mapLib` passed to a real `<MapGL>` in integration-style tests.
 */
export function createMockMapLib(opts: { isMapLibre?: boolean } = {}) {
  const isMapLibre = !!opts.isMapLibre;

  // Scope "instances created by this render" to this call — Popup/Marker/Control classes are
  // shared module-level fakes, so without resetting, instances from an earlier test's render
  // would leak into `mapLib.Popup.instances` here.
  MockPopup.instances = [];
  MockMarker.instances = [];
  MockControl.instances = [];

  function Map(this: any, _options?: any) {
    const instance = createMockMap({ isMapLibre });
    (Map as any).instances.push(instance);
    // Fire `load` on the next microtask so handlers registered synchronously right after
    // `new mapLib.Map(...)` (as MapGL does) are in place before it fires.
    Promise.resolve().then(() => instance.fire("load"));
    return instance;
  }
  // `MapGL` tells Mapbox from MapLibre by checking for `setConfigProperty` on the prototype —
  // only define it here for the Mapbox-shaped fake.
  if (!isMapLibre) (Map as any).prototype.setConfigProperty = () => {};
  (Map as any).instances = [] as MockMap[];

  class MercatorCoordinate {
    x = 0;
    y = 0;
    z = 0;
    static fromLngLat(_lngLat: any, altitude = 0) {
      return { x: 0, y: 0, z: altitude, meterInMercatorCoordinateUnits: () => 1 };
    }
    meterInMercatorCoordinateUnits() {
      return 1;
    }
  }

  return {
    Map: Map as any,
    Popup: MockPopup,
    Marker: MockMarker,
    NavigationControl: MockControl,
    ScaleControl: MockControl,
    AttributionControl: MockControl,
    GeolocateControl: MockControl,
    FullscreenControl: MockControl,
    LogoControl: MockControl,
    TerrainControl: MockControl,
    MercatorCoordinate,
    version: "mock",
  };
}

/**
 * Fake `@mapbox/mapbox-gl-draw`-shaped `lib` prop for `<Draw>`. The custom modes under
 * `components/Draw/modes` only ever spread `lib.modes.draw_*` at construction time (never call
 * into it eagerly), so an empty `modes` object is enough to exercise `Draw`'s own wiring.
 */
export function createMockDrawLib() {
  function MapboxDraw(this: any, options?: any) {
    this.options = options;
    this.onAdd = vi.fn(() => document.createElement("div"));
    this.onRemove = vi.fn();
  }
  (MapboxDraw as any).modes = {};
  (MapboxDraw as any).lib = { theme: [] };
  (MapboxDraw as any).constants = {
    classes: {
      CANVAS: "mapboxgl-canvas",
      CONTROL_BASE: "mapboxgl-ctrl",
      CONTROL_PREFIX: "mapboxgl-ctrl-",
      CONTROL_GROUP: "mapboxgl-ctrl-group",
      ATTRIBUTION: "mapboxgl-ctrl-attrib",
    },
  };
  return MapboxDraw as any;
}

/** Await a microtask tick — use after triggering mock events before asserting effect results. */
export const tick = () => Promise.resolve().then(() => Promise.resolve());
