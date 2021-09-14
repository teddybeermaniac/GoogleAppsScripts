import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import injectProcessEnv from 'rollup-plugin-inject-process-env';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from "rollup-plugin-terser";
import typescript from '@rollup/plugin-typescript';
import fs from 'fs';

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

function getEnvironment() {
  var fileEnvironment = {};
  try {
    fileEnvironment = JSON.parse(fs.readFileSync(`${__dirname}/../_common/env.json`));
  } catch { }
  var processEnvironment = Object.fromEntries(Object.entries(process.env).filter(([key, _]) => key.startsWith('GAS_')).map(([key, value]) => [key.replace(/^GAS_/, ''), value]));

  return {
    ...fileEnvironment,
    ...processEnvironment
  };
}

export default {
  input: './src/index.ts',
  onwarn: function(warning, defaultHandler) {
    if (['THIS_IS_UNDEFINED'].includes(warning.code)) {
      return;
    }

    defaultHandler(warning);
  },
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
    injectProcessEnv(getEnvironment()),
    googleAppsScript(),
    terser({
      ecma: 2019,
      keep_classnames: true
    })
  ],
  strictDeprecations: true
};
