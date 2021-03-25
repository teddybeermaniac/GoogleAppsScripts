import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

function googleAppsScript() {
  return {
    name: 'google-apps-script',
    renderChunk: (code, chunk, options) => {
      return `${code}\n${chunk.exports.map(name => {
        return `function ${name}() {\n    ${options.name}.${name}();\n}`
      }).join('\n')}`;
    }
  }
}

export default {
  input: './src/index.ts',
  output: {
    dir: '.',
    format: 'iife',
    interop: 'auto',
    name: 'gas',
    validate: true
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json'
    }),
    babel({
      babelrc: false,
      babelHelpers: 'bundled',
      exclude: '**/node_modules/**',
      presets: [
        [
          '@babel/preset-env',
          {
            corejs: 3,
            modules: false,
            useBuiltIns: "entry",
            targets: {
              chrome: '55',
            },
          },
        ],
      ],
    }),
    nodeResolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs({
      extensions: [
        '.js',
        '.ts'
      ],
      sourceMap: false,
      transformMixedEsModules: true
    }),
    googleAppsScript()
  ],
  strictDeprecations: true,
  treeshake: false
};
