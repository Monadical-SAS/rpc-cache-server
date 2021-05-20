import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import json from "@rollup/plugin-json";
import nodePolyfills from 'rollup-plugin-node-polyfills';

const env = process.env.NODE_ENV;
const extensions = ['.js', '.ts'];

function generateConfig(configType, format) {
  const browser = configType === 'browser';

  const config = {
    input: 'rpc-cache-connection/src/index.ts',
    plugins: [
      commonjs(),
      nodeResolve({
        browser,
        dedupe: ['bn.js', 'buffer'],
        extensions,
        preferBuiltins: !browser,
      }),
      json({
        include: ["rpc-cache.config.json"],
      }),
      babel({
        exclude: '**/node_modules/**',
        extensions,
        babelHelpers: 'runtime',
        plugins: ['@babel/plugin-transform-runtime'],
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify(env),
        'process.env.BROWSER': JSON.stringify(browser),
      }),
    ],
    onwarn: function (warning, rollupWarn) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        rollupWarn(warning);
      }
    },
    treeshake: {
      moduleSideEffects: false,
    },
  };


    config.output = [
      {
        file: 'dist.browser/lib/index.browser.esm.js',
        format: 'es',
        sourcemap: true,
      },
    ];

    // Prevent dependencies from being bundled
    config.external = [
      /@babel\/runtime/,
      'bn.js',
      'bs58',
      'buffer',
      'buffer-layout',
      'crypto-hash',
      'jayson/lib/client/browser',
      'js-sha3',
      'node-fetch',
      'rpc-websockets',
      'secp256k1',
      'superstruct',
      'tweetnacl',
    ];
    config.plugins.push(nodePolyfills());

  return config;
}

export default [
  generateConfig('browser', 'esm'),
];
