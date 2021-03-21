import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import nodeResolver from '@rollup/plugin-node-resolve';
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
        banner: 'var global = this;',
        dir: '.',
        format: 'iife',
        interop: 'auto',
        name: 'module',
        validate: true
    },
    plugins: [
        typescript({
            tsconfig: './tsconfig.json'
        }),
        nodePolyfills(),
        nodeResolver({
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
