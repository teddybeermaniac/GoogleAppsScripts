import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import injectProcessEnv from 'rollup-plugin-inject-process-env';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from "rollup-plugin-terser";
import typescript from '@rollup/plugin-typescript';
import env from './env.json';

function googleAppsScript() {
  return {
    name: 'google-apps-script',
    renderChunk: (code, chunk, options) => {
      const eval2 = eval;
      const container = eval2(`${code}; ${options.name}.container`);
      if (!container) {
        console.warn('Warning! \'container\' variable not exported!');

        return code;
      }

      const provider = container.get(Symbol.for('__ROLLUP_EXPORTED_METHOD_PROVIDER__'));
      const methods = {};
      provider.getExportedMethods().forEach((method) => {
        methods[method] = `function ${method}(...args) {\n  return ${options.name}.container.get(Symbol.for('IExportedMethodProvider')).callExportedMethod('${method}', args);\n}`;
      });

      const methodsNames = Object.keys(methods);
      methodsNames.sort();
      const methodsCode = methodsNames.map((method) => methods[method]).join('\n\n');

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
    json({
      preferConst: true
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
      dynamicRequireTargets: [
        '../helpers-caching/node_modules/inversify/lib/syntax/binding_{on,when}_syntax.js',
        '../helpers-exchange/node_modules/inversify/lib/syntax/binding_{on,when}_syntax.js',
        '../helpers-exporting/node_modules/inversify/lib/syntax/binding_{on,when}_syntax.js',
        '../helpers-filesystem/node_modules/inversify/lib/syntax/binding_{on,when}_syntax.js',
        '../helpers-iteration/node_modules/inversify/lib/syntax/binding_{on,when}_syntax.js',
        '../helpers-logging/node_modules/inversify/lib/syntax/binding_{on,when}_syntax.js',
        '../helpers-querying/node_modules/inversify/lib/syntax/binding_{on,when}_syntax.js',
        '../helpers-triggering/node_modules/inversify/lib/syntax/binding_{on,when}_syntax.js',
        '../helpers-utilities/node_modules/inversify/lib/syntax/binding_{on,when}_syntax.js',
        'node_modules/inversify/lib/syntax/binding_{on,when}_syntax.js',
      ],
      extensions: [
        '.js',
        '.ts'
      ],
      sourceMap: false,
      transformMixedEsModules: true
    }),
    // EXCHANGE_RATE_API_COM_EXCHANGE_PROVIDER_API_KEY
    injectProcessEnv(env),
    terser({
      ecma: 2019
    }),
    googleAppsScript()
  ],
  strictDeprecations: true
};
