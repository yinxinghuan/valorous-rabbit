import { copyFile, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const gameRoot = path.resolve(scriptDir, '..');
const libraryRoot = '/Users/yin/code/games/_lowpoly_lab';
const inventoryPath = path.join(libraryRoot, 'assets/ASSETS.json');
const outputDir = path.join(gameRoot, 'src/assets/characters');
const manifestPath = path.join(gameRoot, 'src/assets/character-inventory.json');

const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
const characterCategories = new Set(
  Object.entries(inventory.categories)
    .filter(([, category]) => category.kind === 'character')
    .map(([id]) => id),
);
const characters = inventory.assets.filter((asset) => characterCategories.has(asset.category));

if (!characters.length) throw new Error('The live inventory contains no character assets.');

await mkdir(outputDir, { recursive: true });
const expectedFiles = new Set();

for (const asset of characters) {
  const stem = `${asset.category}__${asset.id}`;
  const glbName = `${stem}.glb`;
  const spriteName = `${stem}.png`;
  expectedFiles.add(glbName);
  expectedFiles.add(spriteName);
  await copyFile(path.join(libraryRoot, asset.glb), path.join(outputDir, glbName));
  await copyFile(path.join(libraryRoot, asset.sprite), path.join(outputDir, spriteName));
}

for (const file of await readdir(outputDir)) {
  if (!expectedFiles.has(file) && /\.(glb|png)$/i.test(file)) {
    await unlink(path.join(outputDir, file));
  }
}

const manifest = characters.map((asset) => ({
  key: `${asset.category}/${asset.id}`,
  id: asset.id,
  category: asset.category,
  name: { zh: asset.name_zh, en: asset.name_en },
  tags: asset.tags,
  footprint: asset.footprint,
  rigNodes: asset.rig?.nodes || [],
  assetStem: `${asset.category}__${asset.id}`,
}));

await writeFile(manifestPath, `${JSON.stringify({
  source: '_lowpoly_lab/assets/ASSETS.json',
  inventoryCount: inventory.count,
  characterCount: manifest.length,
  characters: manifest,
}, null, 2)}\n`);

console.log(JSON.stringify({
  source: inventoryPath,
  characterCount: manifest.length,
  outputDir,
  manifestPath,
}, null, 2));
