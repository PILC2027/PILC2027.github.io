import { build } from 'esbuild';
await build({ entryPoints: ['src/app.js'], bundle: true, outfile: 'assets/app.js', format: 'esm', minify: true, target: ['es2022'], legalComments: 'eof' });
console.log('Built assets/app.js. The repository root is ready for GitHub Pages.');
