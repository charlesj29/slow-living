// The on-disk world format. The live world is loaded from a baked map file so
// its layout never changes by accident; generation is only an authoring tool.
//
// Terrain is stored in square chunks addressed by chunk coordinates, so the
// world can grow by adding chunks. Each chunk row is a string with one
// character per tile (see `mapChar` in the tile registry): readable, editable
// by hand and friendly to git diffs.
import { toIndex } from '@/shared/engine/grid';
import { getTileDefinition } from './tiles';
import type { World } from './world';

export const MAP_FILE_VERSION = 1;

/** [kind, x, y] with x/y relative to the chunk's top-left tile. */
export type MapFileObject = readonly [kind: string, x: number, y: number];

export interface MapFileChunk {
  /** Chunk coordinates (tile x = chunk x * chunkSize + local x). */
  readonly x: number;
  readonly y: number;
  readonly rows: readonly string[];
  readonly objects: readonly MapFileObject[];
}

export interface MapFile {
  readonly version: number;
  readonly name: string;
  /** Where the map came from (informational; editing the file by hand is fine). */
  readonly source: { readonly seed: number; readonly generationSeed: number };
  readonly chunkSize: number;
  readonly widthChunks: number;
  readonly heightChunks: number;
  readonly spawn: readonly [x: number, y: number];
  readonly chunks: readonly MapFileChunk[];
}

export function worldToMapFile(world: World, name: string, chunkSize: number): MapFile {
  if (world.width % chunkSize !== 0 || world.height % chunkSize !== 0) {
    throw new Error(`World size must be a multiple of the chunk size (${String(chunkSize)})`);
  }
  const widthChunks = world.width / chunkSize;
  const heightChunks = world.height / chunkSize;
  const chunks: MapFileChunk[] = [];
  for (let cy = 0; cy < heightChunks; cy++) {
    for (let cx = 0; cx < widthChunks; cx++) {
      const left = cx * chunkSize;
      const top = cy * chunkSize;
      const rows: string[] = [];
      for (let y = top; y < top + chunkSize; y++) {
        let row = '';
        for (let x = left; x < left + chunkSize; x++) {
          row += getTileDefinition(world.terrain[toIndex(world, x, y)] ?? 0).mapChar;
        }
        rows.push(row);
      }
      const objects = world.objects
        .filter((o) => o.x >= left && o.x < left + chunkSize && o.y >= top && o.y < top + chunkSize)
        .map((o): MapFileObject => [o.kind, o.x - left, o.y - top]);
      chunks.push({ x: cx, y: cy, rows, objects });
    }
  }
  return {
    version: MAP_FILE_VERSION,
    name,
    source: { seed: world.seed, generationSeed: world.generationSeed },
    chunkSize,
    widthChunks,
    heightChunks,
    spawn: [world.spawn.x, world.spawn.y],
    chunks,
  };
}

/**
 * JSON with one terrain row and one object per line, so the file reads like a
 * map and diffs stay local to the tiles that changed.
 */
export function formatMapFile(map: MapFile): string {
  const json = (value: unknown): string => JSON.stringify(value);
  const chunkText = map.chunks.map((chunk) => {
    const rows = chunk.rows.map((row) => `        ${json(row)}`).join(',\n');
    const objects = chunk.objects.map((o) => `        ${json(o)}`).join(',\n');
    return [
      `    {`,
      `      "x": ${json(chunk.x)},`,
      `      "y": ${json(chunk.y)},`,
      `      "rows": [\n${rows}\n      ],`,
      objects ? `      "objects": [\n${objects}\n      ]` : `      "objects": []`,
      `    }`,
    ].join('\n');
  });
  return [
    `{`,
    `  "version": ${json(map.version)},`,
    `  "name": ${json(map.name)},`,
    `  "source": ${json(map.source)},`,
    `  "chunkSize": ${json(map.chunkSize)},`,
    `  "widthChunks": ${json(map.widthChunks)},`,
    `  "heightChunks": ${json(map.heightChunks)},`,
    `  "spawn": ${json(map.spawn)},`,
    `  "chunks": [\n${chunkText.join(',\n')}\n  ]`,
    `}`,
    ``,
  ].join('\n');
}
