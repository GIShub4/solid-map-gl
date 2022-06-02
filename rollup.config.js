import withSolid from 'rollup-preset-solid'
import css from 'rollup-plugin-import-css'
import copy from 'rollup-plugin-copy'
import { uglify } from 'rollup-plugin-uglify'

export default withSolid({
  input: 'src/index.tsx',
  plugins: [
    css({ output: 'styles.css', minify: true }),
    uglify(),
    copy({
      targets: [{ src: 'src/style.css', dest: 'dist/source' }],
    }),
  ],
})
