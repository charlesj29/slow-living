// Authoring tool: a contact sheet of generated islands, to compare seeds before baking one.
// Usage: npm run overview:island -- <out.png> [firstSeed=1] [count=16] [scale=3]
// Colours are the registries' map colours; the magenta cross marks the spawn.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const cfg = {
  root,
  configFile: false,
  logLevel: 'error',
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
};
const load = async (p) => (await runnerImport(p, cfg)).module;
const { generateWorld } = await load('/src/games/island/core/generation/generateWorld.ts');
const { ISLAND_CONFIG } = await load('/src/games/island/core/config.ts');
const { getTileDefinition } = await load('/src/games/island/core/world/tiles.ts');
const { OBJECT_REGISTRY } = await load('/src/games/island/core/world/objects.ts');

const [out, firstArg, countArg, scaleArg] = process.argv.slice(2);
const first = Number(firstArg ?? 1);
const count = Number(countArg ?? 16);
const scale = Number(scaleArg ?? 3);
const cols = Math.min(4, count);
const rows = Math.ceil(count / cols);
const W = ISLAND_CONFIG.map.widthTiles;
const H = ISLAND_CONFIG.map.heightTiles;
const cell = W * scale + 8;
const img = Buffer.alloc(cols * cell * rows * cell * 3, 20);
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const put = (px, py, rgb) => {
  const i = (py * cols * cell + px) * 3;
  img[i] = rgb[0];
  img[i + 1] = rgb[1];
  img[i + 2] = rgb[2];
};

for (let n = 0; n < count; n++) {
  const seed = first + n;
  const t0 = performance.now();
  const r = generateWorld(seed, ISLAND_CONFIG);
  const ms = (performance.now() - t0).toFixed(0);
  if (!r.ok) {
    console.log(
      `seed ${seed}: FAILED after ${r.attempts}: ${r.issues.map((i) => i.code).join(',')}`,
    );
    continue;
  }
  const w = r.world;
  const colors = new Array(W * H);
  for (let i = 0; i < W * H; i++) colors[i] = hex(getTileDefinition(w.terrain[i]).mapColor);
  const kinds = {};
  for (const o of w.objects) {
    const def = OBJECT_REGISTRY[o.kind];
    kinds[def.category] = (kinds[def.category] ?? 0) + 1;
    const c = hex(def.mapColor);
    for (let dy = 0; dy < def.footprint.height; dy++)
      for (let dx = 0; dx < def.footprint.width; dx++) colors[(o.y + dy) * W + o.x + dx] = c;
  }
  const ox = (n % cols) * cell + 4;
  const oy = Math.floor(n / cols) * cell + 4;
  for (let y = 0; y < H * scale; y++)
    for (let x = 0; x < W * scale; x++)
      put(ox + x, oy + y, colors[Math.floor(y / scale) * W + Math.floor(x / scale)]);
  // Mark spawn in magenta.
  for (let d = -scale; d < 2 * scale; d++) {
    put(ox + w.spawn.x * scale + d, oy + w.spawn.y * scale + 1, [255, 0, 255]);
    put(ox + w.spawn.x * scale + 1, oy + w.spawn.y * scale + d, [255, 0, 255]);
  }
  const land = [...w.terrain].filter((t) => t >= 3).length;
  const vg = w.village ? `village gate ${w.village.gate}` : 'NO VILLAGE';
  console.log(
    `seed ${seed}: ok (${r.attempts} att, ${ms} ms) cabin ${w.cabin.x},${w.cabin.y} ${vg} land ${land} ${JSON.stringify(kinds)}`,
  );
}

// Minimal PNG writer (RGB, no filter).
const width = cols * cell;
const height = rows * cell;
const raw = Buffer.alloc((width * 3 + 1) * height);
for (let y = 0; y < height; y++)
  img.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 2;
writeFileSync(
  out,
  Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]),
);
console.log('wrote', out);
