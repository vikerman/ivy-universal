import bo from '@angular-devkit/build-optimizer/src/build-optimizer/rollup-plugin';
import terser from 'rollup-plugin-terser';
import node_resolve from 'rollup-plugin-node-resolve-angular';
import visualizer from 'rollup-plugin-visualizer';

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  console.log('Production Build:');
}

export default {
  input: './out-tsc/src/main.js',
  output: {
    dir: 'dist/rollup',
    format: 'esm',
    sourcemap: true
  },
  plugins: [
    node_resolve({
      es2015: true,
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
    isProduction && terser.terser({
      ecma: 6,
      compress: {
        pure_getters: true,
        passes: 3,
        global_defs: {
          ngDevMode: false,
        },
      }
    }),
    isProduction && visualizer({sourcemap: true, filename: './dist/stats.html'}),
  ],
}
