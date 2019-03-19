import bo from '@angular-devkit/build-optimizer/src/build-optimizer/rollup-plugin';
import terser from 'rollup-plugin-terser';
import node_resolve from 'rollup-plugin-node-resolve-angular';

export default {
  input: './out-tsc/app/main.js',
  output: {
    dir: 'dist/rollup',
    format: 'esm',
    sourcemap: true
  },
  plugins: [
    node_resolve({es2015:true, module: true}),
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
