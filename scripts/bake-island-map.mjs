// Authoring tool: generates the island from a seed and writes the map file the
// game loads. Usage: npm run bake:island [-- <seed>]
// Re-baking replaces the whole layout (including hand edits), so review the
// diff before committing.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const outFile = fileURLToPath(new URL('../src/games/island/data/island.map.json', import.meta.url));

// runnerImport runs our TypeScript without a build step. It doesn't apply
// vite.config.ts aliases, so the `@/` alias is repeated here.
const runnerConfig = {
  root,
  configFile: false,
  logLevel: 'error',
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
};
const load = async (path) => (await runnerImport(path, runnerConfig)).module;
const { bakeIslandMap } = await load('/src/games/island/core/generation/bakeIslandMap.ts');
const { ISLAND_CONFIG } = await load('/src/games/island/core/config.ts');

const seedArg = process.argv[2];
const seed = seedArg === undefined ? ISLAND_CONFIG.generation.authoringSeed : Number(seedArg);
if (!Number.isInteger(seed) || seed < 0) {
  console.error(`Invalid seed "${seedArg}". Use a non-negative integer.`);
  process.exit(1);
}

const text = bakeIslandMap(seed);
writeFileSync(outFile, text);
console.log(`Baked island from seed ${seed} -> ${outFile} (${(text.length / 1024).toFixed(0)} KB)`);
