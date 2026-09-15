import { defineConfig } from "tsup";
import * as preset from "tsup-preset-solid";
import pkg from "./package.json" with { type: "json" };

// tsup normally auto-externalizes package.json's dependencies/peerDependencies
// on its own (via `getProductionDeps`), but that lookup is unreliable here —
// observed producing an empty list at build time regardless of package.json's
// actual contents, silently bundling mapbox-gl/maplibre-gl/three/@babylonjs
// core (multi-MB each) straight into dist/. List them explicitly instead.
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  "solid-js/store",
  "solid-js/web",
];

const preset_options: preset.PresetOptions = {
  entries: [{ entry: "src/index.tsx" }, { entry: "src/testing.tsx" }],
  modify_esbuild_options: (options, permutation) => {
    // Only minify the bundled production build — the "solid" export
    // condition's raw JSX passthrough must stay untouched so SolidStart's
    // own compiler can process it.
    if (!permutation.type.jsx) options.minify = true;
    return options;
  },
};

export default defineConfig((config) => {
  const watching = !!config.watch;
  const parsed_data = preset.parsePresetOptions(preset_options, watching);

  if (!watching) {
    const package_fields = preset.generatePackageExports(parsed_data);
    // Every subpath's conditions object (one per entry — "." for src/index.tsx, "./testing" for
    // src/testing.tsx) is gated only on "import"/"solid"/"require" conditions, with no top-level
    // "types"/"default" fallback — `require()` and any resolver using a bare "node" condition get
    // ERR_PACKAGE_PATH_NOT_EXPORTED. Add both per subpath, pointing at the same ESM build already
    // generated for that entry, matching this package's pre-tsup exports shape (rollup-preset-solid
    // always included one).
    const exports: Record<string, unknown> = { "./package.json": "./package.json" };
    for (const [subpath, conditions] of Object.entries(package_fields.exports)) {
      exports[subpath] = {
        types: (conditions as any).import?.types,
        ...(conditions as any),
        default: (conditions as any).import?.default,
      };
    }
    package_fields.exports = exports as typeof package_fields.exports;
    preset.writePackageJson(package_fields);
  }

  return preset.generateTsupOptions(parsed_data).map((options) => {
    // tsup's own `pkg.type`-based ESM extension default (.js vs .mjs) reads
    // package.json through a cache that's been observed stale/empty at this
    // point in the build (same root cause as the `external` override above),
    // producing dist/index.mjs while writePackageJson's own package.json
    // output unconditionally assumes ".js" for the non-"solid" export. Pin
    // it explicitly so the two stay in sync regardless of that bug.
    const original_out_extension = options.outExtension;
    return {
      ...options,
      external,
      outExtension: (ctx: Parameters<NonNullable<typeof original_out_extension>>[0]) => ({
        js: ".js",
        ...original_out_extension?.(ctx),
      }),
    };
  });
});
