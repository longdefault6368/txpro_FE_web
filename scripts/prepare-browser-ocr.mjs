import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
const require = createRequire(import.meta.url);
const target = resolve(import.meta.dirname, '../public/ocr');
await mkdir(target, { recursive: true });
await copyFile(require.resolve('tesseract.js/dist/worker.min.js'), resolve(target, 'worker.min.js'));
const core = dirname(require.resolve('tesseract.js-core/package.json'));
for (const name of await readdir(core)) {
  if (/^tesseract-core.*\.(?:wasm|wasm\.js)$/.test(name)) await copyFile(resolve(core, name), resolve(target, name));
}
for (const lang of ['eng', 'vie']) {
  const root = dirname(require.resolve('@tesseract.js-data/' + lang + '/package.json'));
  await copyFile(resolve(root, '4.0.0', lang + '.traineddata.gz'), resolve(target, lang + '.traineddata.gz'));
}
console.log('Browser OCR assets prepared locally.');
