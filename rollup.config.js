import bo from '@angular-devkit/build-optimizer/src/build-optimizer/rollup-plugin';
import terser from 'rollup-plugin-terser';
import node_resolve from 'rollup-plugin-node-resolve-angular';
import visualizer from 'rollup-plugin-visualizer';

export default {
  input: './out-tsc/app/main.js',
  output: {
    dir: 'dist/rollup',
    format: 'esm',
    sourcemap: true
  },
  plugins: [
    node_resolve({
      es2015:true,
      module: true,
      jsnext: true,
      main: true,
    }),
    bo({
      sideEffectFreeModules: [
        '@angular/core',
        '@angular/common',
        'rxjs'
      ]
    }),
    terser.terser({
      ecma: 6,
      compress: {
        pure_getters: true,
        passes: 3,
        global_defs: {
          ngDevMode: false,
        },
      }
    }),
    visualizer({sourcemap: true, filename: './dist/stats.html'}),
  ],
}
