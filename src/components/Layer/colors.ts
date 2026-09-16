// Converts a CSS color string into `rgb()`/`rgba()`, using the browser's own CSS engine rather
// than reimplementing color-space math — handles Tailwind's `oklch()` custom properties and any
// other CSS Color 4 syntax (`lab()`, `lch()`, `color()`, ...) Mapbox GL's own color parser
// (csscolorparser) doesn't understand. Only ever called from components that render as descendants
// of `MapProvider`, which `MapGL` only renders client-side after `onMount`/the map's `load` event —
// so, unlike `MapGL`'s own top-level signal initializers, this never runs during SSR and needs no
// `typeof document` guard.
let probe: HTMLDivElement

const toRgbString = (cssColor: string): string | undefined => {
  probe ??= document.body.appendChild(document.createElement("div"));
  probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
  probe.style.color = "";
  probe.style.color = cssColor;
  return probe.style.color ? getComputedStyle(probe).color : undefined;
};

const tailwindName = /^[a-z]+-\d{2,3}$/;
// Color functions Mapbox's own parser already understands — everything else (oklch, lab, lch,
// color, hwb, ...) needs the browser's engine to resolve first.
const nativelySupported = /^(rgb|rgba|hsl|hsla)\(/i;
const cssColorFunction = /^[a-z-]+\(/i;

// A separate detached probe from `toRgbString`'s (rather than reusing it) so applying a
// `className` here can never collide with an inline `style.color` set by that other path.
let classProbe: HTMLDivElement;
const bgClassPair = /^bg-[a-z]+-\d{2,3}(?:\s+dark:bg-[a-z]+-\d{2,3})?$/;

// Resolves `'bg-{name} dark:bg-{name}'` by applying the real compiled Tailwind utility classes to
// a detached-but-in-DOM probe and reading back whichever one the browser's own cascade decided
// wins — respects whatever dark-mode strategy the consuming app's Tailwind config actually uses (a
// class or data-attribute on any ancestor, a media query, a custom variant), since the cascade
// itself resolves it rather than us guessing the strategy. Unlike `toRgbString`'s inline
// `style.color` (which we set ourselves and always exists), this depends on Tailwind's build-time
// scanner having actually generated `.bg-{name}`/`.dark .bg-{name}` from a literal, complete match
// of that exact string somewhere in the consuming app's own source — a bare, unprefixed color name
// (`'blue-600'`) has no property prefix, so it wouldn't be scanned or generated; the full
// `bg-`-prefixed form is required for this path specifically.
const resolveClassPair = (value: string): string => {
  classProbe ??= document.body.appendChild(document.createElement("div"));
  classProbe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
  classProbe.className = value;
  const bg = getComputedStyle(classProbe).backgroundColor;
  classProbe.className = "";
  // `background-color` (unlike `color`) isn't inherited and defaults to fully transparent, so a
  // class that never got generated is unambiguous here — an inherited `color` would silently
  // return some plausible-looking but wrong ancestor value instead.
  return bg && bg !== "rgba(0, 0, 0, 0)" ? bg : value;
};

/** Resolves a color value for a Mapbox paint `*-color` property:
 * - `'bg-{name} dark:bg-{name}'` resolves via the real Tailwind utility classes and the browser's
 *   own cascade — see `resolveClassPair` above for why this needs the full `bg-`-prefixed form.
 * - A Tailwind color name (`'blue-600'`) resolves through the live `--color-blue-600` custom
 *   property Tailwind v4 defines on `:root` — including the consuming app's own customized/
 *   extended theme colors. Requires Tailwind v4 to be installed and its CSS loaded; there is no
 *   fallback palette, so an unset variable leaves the name unchanged (and Mapbox will reject it).
 * - A CSS Color 4 function Mapbox doesn't parse (`oklch(...)`, `lab(...)`, `color(...)`, ...)
 *   resolves directly, so users can write those in place of a Tailwind name too.
 * Anything else (hex, rgb/rgba, hsl/hsla, named CSS colors, Mapbox expressions) is returned
 * unchanged — Mapbox already understands it. */
export const resolveColor = (value: string): string => {
  if (bgClassPair.test(value)) return resolveClassPair(value);
  if (tailwindName.test(value)) {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(`--color-${value}`)
      .trim();
    return (raw && toRgbString(raw)) || value;
  }
  if (cssColorFunction.test(value) && !nativelySupported.test(value)) {
    return toRgbString(value) || value;
  }
  return value;
};
