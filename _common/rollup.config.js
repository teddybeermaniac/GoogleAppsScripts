import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

function googleAppsScript() {
  return {
    name: 'google-apps-script',
    renderChunk: (code, chunk, options) => {
      const eval2 = eval;
      const provider = eval2(`${code}; ${options.name}.container`).get('__ROLLUP_EXPORTED_METHOD_PROVIDER__');

      const methodsCode = provider.getSymbols().flatMap((symbol) => {
        return provider.getExportedMethods(symbol).map((method) => {
          const exportedMethod = provider.getMethodExportedName(symbol, method);

          return `function ${exportedMethod}() {\n  ${options.name}.container.get(Symbol.for('${Symbol.keyFor(symbol)}')).${method}();\n}`;
        })
      }).join('\n\n');

      return `${code}\n\n${methodsCode}`;
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
      generatorOpts: {
        comments: false
      },
      only: [
        './src'
      ],
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
  strictDeprecations: true
};
