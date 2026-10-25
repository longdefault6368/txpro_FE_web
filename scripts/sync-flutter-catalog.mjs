// Same illustrations as Flutter; web-sized copies, not new artwork.
// Run from this checkout: node scripts/sync-flutter-catalog.mjs
import { mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import sharp from "sharp";
const root = fileURLToPath(new URL("../", import.meta.url));
const source = resolve(root, "../txpro_FE/assets/images");
const target = resolve(root, "public/images/catalog");
await mkdir(target, { recursive: true });
const files = (await readdir(source)).filter(name => /^(vehicle|cargo)_picker_[a-z_]+\.png$/.test(name));
for (const file of files) {
  await sharp(resolve(source, file)).resize({ width: 640, height: 420, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 88, effort: 5 }).toFile(resolve(target, file.replace(/\.png$/, ".webp")));
}
console.log("Synced " + files.length + " Flutter catalog illustrations.");
