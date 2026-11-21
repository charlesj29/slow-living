import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../config';
import { generateValidWorld } from '../generation/testUtils';
import { formatMapFile, MAP_FILE_VERSION, worldToMapFile, type MapFile } from './mapFile';
import { MapFileError, parseMapFile } from './parseMapFile';

const CHUNK = ISLAND_CONFIG.map.chunkSizeTiles;
const world = generateValidWorld(3);
const mapFile = worldToMapFile(world, 'Test', CHUNK);

function roundTrip(file: MapFile): ReturnType<typeof parseMapFile> {
  return parseMapFile(JSON.parse(formatMapFile(file)));
}

function withChanges(changes: Partial<MapFile>): unknown {
  return { ...mapFile, ...changes };
}

describe('map file round trip', () => {
  it('reproduces the world exactly', () => {
    const loaded = roundTrip(mapFile);
    expect(loaded.width).toBe(world.width);
    expect(loaded.height).toBe(world.height);
    expect(loaded.terrain).toEqual(world.terrain);
    expect(loaded.blocked).toEqual(world.blocked);
    expect(loaded.spawn).toEqual(world.spawn);
    expect(loaded.cabin?.kind).toBe('cabin');
    const key = (o: { kind: string; x: number; y: number }): string =>
      `${o.kind}@${String(o.x)},${String(o.y)}`;
    expect(loaded.objects.map(key).sort()).toEqual(world.objects.map(key).sort());
  });

  it('stores terrain as readable rows of one character per tile', () => {
    const firstChunk = mapFile.chunks[0];
    expect(firstChunk?.rows).toHaveLength(CHUNK);
    expect(firstChunk?.rows[0]).toBe('~'.repeat(CHUNK));
    expect(mapFile.version).toBe(MAP_FILE_VERSION);
  });

  it('writes one terrain row per line', () => {
    const text = formatMapFile(mapFile);
    expect(text).toContain(`        "${'~'.repeat(CHUNK)}"`);
  });
});

describe('parseMapFile errors', () => {
  it.each([
    ['not an object', 42, /JSON object/],
    ['wrong version', withChanges({ version: 99 }), /Unsupported map version/],
    ['missing chunks', withChanges({ chunks: mapFile.chunks.slice(1) }), /missing chunks/],
    [
      'unknown tile',
      withChanges({
        chunks: [
          {
            ...mapFile.chunks[0],
            rows: ['?'.repeat(CHUNK), ...(mapFile.chunks[0]?.rows.slice(1) ?? [])],
          },
          ...mapFile.chunks.slice(1),
        ] as MapFile['chunks'],
      }),
      /unknown tile "\?"/,
    ],
    ['spawn outside', withChanges({ spawn: [-1, 5] }), /spawn/],
    [
      'unknown object',
      withChanges({
        chunks: [
          { ...mapFile.chunks[0], objects: [['dragon', 1, 1]] },
          ...mapFile.chunks.slice(1),
        ] as MapFile['chunks'],
      }),
      /invalid object/,
    ],
  ])('rejects %s', (_name, data, message) => {
    expect(() => parseMapFile(data)).toThrow(MapFileError);
    expect(() => parseMapFile(data)).toThrow(message);
  });

  it('rejects overlapping objects', () => {
    const chunks = mapFile.chunks.map((chunk) => ({ ...chunk, objects: [...chunk.objects] }));
    const target = chunks.find((chunk) => chunk.objects.length > 0);
    const first = target?.objects[0];
    if (!target || !first) throw new Error('fixture has no objects');
    target.objects.push(first);
    expect(() => parseMapFile(withChanges({ chunks }))).toThrow(/overlaps/);
  });
});
