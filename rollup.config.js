import bo from '@angular-devkit/build-optimizer/src/build-optimizer/rollup-plugin';
import terser from 'rollup-plugin-terser';
import node_resolve from 'rollup-plugin-node-resolve';

export default {
  input: './out-tsc/app/main.js',
  output: {
    dir: 'public/',
    format: 'esm'
  },
  plugins: [
    node_resolve({module: true}),
    bo({}),
    terser.terser({
      ecma: 6,
      compress: {
        global_defs: {
          ngDevMode: false,
        },
      }
    }),
  ],
}
