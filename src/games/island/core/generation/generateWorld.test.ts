import { describe, expect, it } from 'vitest';
import {
  EIGHT_DIRECTIONS,
  floodFill,
  forEachNeighbor,
  isOnBorder,
  labelRegions,
  toIndex,
} from '@/shared/engine/grid';
import { ISLAND_CONFIG, type IslandConfig } from '../config';
import { isTileBlocked } from '../world/collision';
import { OBJECT_REGISTRY } from '../world/objects';
import { isLakeTile, isLandTile, isSeaTile, TileId } from '../world/tiles';
import { getDoorFrontTile, type World } from '../world/world';
import { attemptSeed, generateWorld } from './generateWorld';
import { generateValidWorld } from './testUtils';

const SEEDS = Array.from({ length: 50 }, (_, i) => i * 7919 + 1);

describe('generateWorld determinism', () => {
  it('produces an identical world for the same seed', () => {
    const a = generateValidWorld(1234);
    const b = generateValidWorld(1234);
    expect(b.generationSeed).toBe(a.generationSeed);
    expect(b.terrain).toEqual(a.terrain);
    expect(b.objects).toEqual(a.objects);
    expect(b.blocked).toEqual(a.blocked);
    expect(b.spawn).toEqual(a.spawn);
  });

  it('produces different worlds for different seeds', () => {
    expect(generateValidWorld(1).terrain).not.toEqual(generateValidWorld(2).terrain);
  });

  it('derives retry seeds deterministically', () => {
    expect(attemptSeed(99, 0)).toBe(99);
    expect(attemptSeed(99, 3)).toBe(attemptSeed(99, 3));
    expect(attemptSeed(99, 3)).not.toBe(attemptSeed(99, 4));
  });
});

// These checks re-implement the invariants independently of validate.ts, so a
// bug in the validator can't hide a bug in the generator.
function assertInvariants(world: World): void {
  const size = world;
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (isOnBorder(size, x, y)) {
        expect(world.terrain[toIndex(size, x, y)]).toBe(TileId.DeepSea);
      }
    }
  }

  const landShare = world.terrain.filter((id) => isLandTile(id)).length / world.terrain.length;
  expect(landShare).toBeGreaterThanOrEqual(ISLAND_CONFIG.validation.minLandShare);
  expect(landShare).toBeLessThanOrEqual(ISLAND_CONFIG.validation.maxLandShare);

  const lakes = labelRegions(size, (i) => isLakeTile(world.terrain[i] ?? 0));
  expect(lakes.regionSizes).toHaveLength(1);
  world.terrain.forEach((id, i) => {
    if (!isLakeTile(id)) return;
    forEachNeighbor(size, i, EIGHT_DIRECTIONS, (n) => {
      expect(isSeaTile(world.terrain[n] ?? 0)).toBe(false);
    });
  });

  const { footprint } = OBJECT_REGISTRY.cabin;
  const cabin = world.cabin;
  if (!cabin) throw new Error('the island must have a cabin');
  for (let dy = 0; dy < footprint.height; dy++) {
    for (let dx = 0; dx < footprint.width; dx++) {
      const id = world.terrain[toIndex(size, cabin.x + dx, cabin.y + dy)] ?? 0;
      expect(isLandTile(id)).toBe(true);
    }
  }

  expect(isTileBlocked(world, world.spawn.x, world.spawn.y)).toBe(false);
  const door = getDoorFrontTile(cabin);
  const reached = floodFill(size, [toIndex(size, world.spawn.x, world.spawn.y)], (i) => {
    return world.blocked[i] === 0;
  });
  expect(reached[toIndex(size, door.x, door.y)]).toBe(1);
}

describe('generateWorld invariants', () => {
  it.each(SEEDS)('seed %i satisfies all invariants', (seed) => {
    assertInvariants(generateValidWorld(seed));
  });

  it('places the spawn directly in front of the cabin door', () => {
    const world = generateValidWorld(5);
    expect(world.cabin).not.toBeNull();
    if (world.cabin) expect(world.spawn).toEqual(getDoorFrontTile(world.cabin));
  });

  it('keeps the seed the user asked for even after retries', () => {
    const world = generateValidWorld(77);
    expect(world.seed).toBe(77);
  });
});

describe('generateWorld failure handling', () => {
  it('gives up after maxAttempts with the reasons from the last attempt', () => {
    const impossible: IslandConfig = {
      ...ISLAND_CONFIG,
      generation: { ...ISLAND_CONFIG.generation, maxAttempts: 3 },
      validation: { ...ISLAND_CONFIG.validation, minLandShare: 0.99 },
    };
    const result = generateWorld(1, impossible);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.attempts).toBe(3);
      expect(result.seed).toBe(1);
      expect(result.issues.map((i) => i.code)).toContain('land-share-out-of-range');
    }
  });
});
