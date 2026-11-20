import { describe, expect, it } from 'vitest';
import { toIndex } from '@/shared/engine/grid';
import { TileId } from '../world/tiles';
import type { WorldObject } from '../world/world';
import type { GenerationContext } from './context';
import { validContext } from './testUtils';
import { validateGeneration, type ValidationIssueCode } from './validate';

const SEED = 2024;

function codes(context: GenerationContext): ValidationIssueCode[] {
  return validateGeneration(context).map((issue) => issue.code);
}

function withTerrain(
  context: GenerationContext,
  edit: (terrain: Uint8Array) => void,
): GenerationContext {
  const terrain = context.terrain.slice();
  edit(terrain);
  return { ...context, terrain };
}

describe('validateGeneration', () => {
  const base = validContext(SEED);

  it('accepts a generated world', () => {
    expect(codes(base)).toEqual([]);
  });

  it('rejects land on the border', () => {
    const broken = withTerrain(base, (t) => (t[0] = TileId.Grass));
    expect(codes(broken)).toContain('border-not-deep-sea');
  });

  it('rejects too little land', () => {
    const broken = withTerrain(base, (t) => t.fill(TileId.DeepSea));
    expect(codes(broken)).toContain('land-share-out-of-range');
  });

  it('rejects a second lake', () => {
    const broken = withTerrain(base, (t) => (t[toIndex(base.size, 2, 2)] = TileId.LakeWater));
    expect(codes(broken)).toContain('lake-count');
  });

  it('rejects a lake that touches the sea', () => {
    const lakeTile = base.terrain.findIndex((id) => id === TileId.LakeWater);
    const broken = withTerrain(base, (t) => (t[lakeTile + 1] = TileId.ShallowSea));
    expect(codes(broken)).toContain('lake-touches-sea');
  });

  it('rejects a missing cabin', () => {
    expect(codes({ ...base, cabin: null })).toContain('cabin-missing');
  });

  it('rejects a cabin standing in water', () => {
    const cabin = base.cabin as WorldObject;
    const broken = withTerrain(
      base,
      (t) => (t[toIndex(base.size, cabin.x, cabin.y)] = TileId.ShallowSea),
    );
    expect(codes(broken)).toContain('cabin-not-on-land');
  });

  it('rejects a missing spawn', () => {
    expect(codes({ ...base, spawn: null })).toContain('spawn-missing');
  });

  it('rejects a spawn boxed in by trees', () => {
    const spawn = base.spawn ?? { x: 0, y: 0 };
    const fence: WorldObject[] = [
      { x: spawn.x - 1, y: spawn.y },
      { x: spawn.x + 1, y: spawn.y },
      { x: spawn.x, y: spawn.y + 1 },
    ].map((p, i) => ({ id: base.objects.length + i, kind: 'tree_pine', ...p }));
    const broken = { ...base, objects: [...base.objects, ...fence] };
    expect(codes(broken)).toContain('reachable-area-too-small');
  });
});
