import withSolid from 'rollup-preset-solid'
import css from 'rollup-plugin-import-css'
import terser from '@rollup/plugin-terser'

export default withSolid({
  input: 'src/index.tsx',
  plugins: [css({ output: 'styles.css', minify: true }), terser()],
})
