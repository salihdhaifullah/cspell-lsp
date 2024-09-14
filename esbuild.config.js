const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/server.ts'],  // Entry point for your TypeScript code
  bundle: true,                   // Bundle all dependencies into a single file
  platform: 'node',               // Target platform is Node.js
  target: 'node14',               // Target Node.js version
  outfile: 'dist/server.js',      // Output bundled file
  format: 'cjs',                  // Output format as CommonJS
  sourcemap: false,                // Enable source maps for debugging
  minify: false,                  // Disable minification (optional)
  logLevel: 'info',               // Show build info logs
}).catch(() => process.exit(1));
