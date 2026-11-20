import { describe, expect, it } from 'vitest';
import { computeBlockedMask } from './collision';
import type { ObjectKind } from './objects';
import { TileId } from './tiles';
import type { WorldObject } from './world';

const size = { width: 6, height: 4 };

function terrainOf(tile: TileId): Uint8Array {
  return new Uint8Array(size.width * size.height).fill(tile);
}

function objectAt(kind: ObjectKind, x: number, y: number): WorldObject {
  return { id: 0, kind, x, y };
}

describe('computeBlockedMask', () => {
  it.each([
    ['deep sea', TileId.DeepSea, 1],
    ['shallow sea', TileId.ShallowSea, 1],
    ['lake water', TileId.LakeWater, 1],
    ['lake shallows', TileId.LakeShallow, 1],
    ['sand', TileId.Sand, 0],
    ['grass', TileId.Grass, 0],
  ] as const)('%s tiles have blocked = %d', (_name, tile, expected) => {
    const blocked = computeBlockedMask(size, terrainOf(tile), []);
    expect(blocked.every((value) => value === expected)).toBe(true);
  });

  it('blocks a big tree along its 2-tile trunk row only (the crown is walk-behind)', () => {
    const blocked = computeBlockedMask(size, terrainOf(TileId.Grass), [objectAt('tree_oak', 1, 2)]);
    expect(blocked[2 * size.width + 1]).toBe(1);
    expect(blocked[2 * size.width + 2]).toBe(1);
    expect(blocked.reduce((sum, v) => sum + v, 0)).toBe(2);
  });

  it.each(['tree_small', 'bush', 'rock', 'fence', 'mailbox'] as const)(
    'blocks a %s tile',
    (kind) => {
      const blocked = computeBlockedMask(size, terrainOf(TileId.Grass), [objectAt(kind, 2, 1)]);
      expect(blocked[1 * size.width + 2]).toBe(1);
      expect(blocked.reduce((sum, v) => sum + v, 0)).toBe(1);
    },
  );

  it('blocks the whole cabin footprint', () => {
    const blocked = computeBlockedMask(size, terrainOf(TileId.Grass), [objectAt('cabin', 0, 0)]);
    expect(blocked.reduce((sum, v) => sum + v, 0)).toBe(15);
    expect(blocked[3 * size.width + 1]).toBe(0);
  });

  it('keeps flowers and grass tufts walkable', () => {
    const blocked = computeBlockedMask(size, terrainOf(TileId.Grass), [
      objectAt('flower_red', 0, 0),
      objectAt('flower_blue', 1, 0),
      objectAt('grass_tuft', 2, 0),
    ]);
    expect(blocked.every((value) => value === 0)).toBe(true);
  });
});
