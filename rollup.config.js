import withSolid from "rollup-preset-solid";
import css from "rollup-plugin-import-css";
import terser from "@rollup/plugin-terser";

const config = withSolid({
  input: "src/index.ts",
  plugins: [css({ output: "styles.css", minify: true }), terser()],
});

// rollup-preset-solid's built-in "fix-import-extensions" plugin assumes every
// relative "./..." import inside a .tsx file targets another .tsx/.jsx file,
// which corrupts imports of plain .ts sibling modules (e.g. Draw/index.tsx's
// "./modes/*") into unresolvable "*.jsx" specifiers. Nothing here relies on
// its node16/nodenext extension rewriting, so drop it.
config.plugins = config.plugins.filter(
  (plugin) => plugin.name !== "fix-import-extensions",
);

export default config;
