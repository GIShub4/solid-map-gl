import withSolid from 'rollup-preset-solid'
import css from 'rollup-plugin-import-css'
import { uglify } from 'rollup-plugin-uglify'

export default withSolid([
  {
    input: 'src/index.tsx',
    output: [
      {
        file: 'dist/esm/index.js',
        format: 'es',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/cjs/index.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
    ],
    plugins: [css(), uglify()],
  },
])
