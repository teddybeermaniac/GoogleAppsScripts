import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import nodeResolver from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

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
        })
    ],
    strictDeprecations: true
};
