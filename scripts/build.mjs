import { build } from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await build({ entryPoints: ['src/app.js'], bundle: true, outfile: 'assets/app.js', format: 'esm', minify: true, target: ['es2022'], legalComments: 'eof' });
console.log('Built assets/app.js. The repository root is ready for GitHub Pages.');
const version=createHash('sha256').update(await readFile('assets/app.js')).update(await readFile('scripts/service-worker.template.js')).digest('hex').slice(0,12);
await writeFile('sw.js',(await readFile('scripts/service-worker.template.js','utf8')).replace('__VERSION__',version));
