const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['test/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'dist/test.js',
    format: 'cjs',
    sourcemap: false,
    minify: false,
    logLevel: 'info',
}).catch(() => process.exit(1));
