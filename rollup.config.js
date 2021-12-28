import withSolid from 'rollup-preset-solid'
import css from 'rollup-plugin-import-css'

export default withSolid({
  input: 'src/index.tsx',
  printInstructions: true,
  plugins: [css({ output: 'styles.css' })],
})
