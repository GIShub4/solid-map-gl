import js from "@eslint/js";
import tseslint from "typescript-eslint";
import solid from "eslint-plugin-solid/configs/typescript";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "coverage", "docs", "examples", "node_modules"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    ...solid,
    languageOptions: {
      ...solid.languageOptions,
      globals: globals.browser,
    },
    rules: {
      ...solid.rules,
      // Matches tsconfig.json's `noImplicitAny: false`: the imperative map/draw/3D APIs this wraps
      // are typed loosely on purpose, and the test mocks stand in for them.
      "@typescript-eslint/no-explicit-any": "off",
      // `cond && map.doThing()` / `cond ? a() : b()` is this codebase's idiom for guarded calls.
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Tests stub constructors (e.g. `window.Image`) and capture the instance via `this`.
    files: ["src/**/*.test.{ts,tsx}"],
    rules: { "@typescript-eslint/no-this-alias": "off" },
  },
  {
    // The remaining `<Layer style={...}>` tests deliberately exercise the deprecated prop (top-level
    // paint/layout keys mixed in one object, `style.filter` vs. the `filter` prop) until 3.0 drops it.
    // <Light style={...}> takes a Mapbox light spec, not CSS.
    files: ["src/components/Layer/index.test.tsx", "src/components/Light/index.test.tsx"],
    rules: { "solid/style-prop": "off" },
  },
);
