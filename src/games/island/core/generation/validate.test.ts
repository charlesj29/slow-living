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

  it('rejects an island without the village', () => {
    expect(codes({ ...base, village: null })).toContain('village-missing');
  });

  it('rejects an island without the studio', () => {
    const objects = base.objects.filter((object) => object.kind !== 'studio');
    expect(codes({ ...base, objects })).toContain('studio-missing');
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

  it('rejects a map without a dock', () => {
    const broken = withTerrain(base, (t) =>
      t.forEach((id, i) => id === TileId.Dock && (t[i] = TileId.LakeWater)),
    );
    expect(codes(broken)).toContain('dock-missing');
  });

  it('rejects a beach that a ledge cuts off', () => {
    const { width } = base.size;
    // A beach tile below the grass, walled in by rocks on its other sides, under a new ledge.
    const beach = base.terrain.findIndex(
      (id, i) => id === TileId.Sand && base.terrain[i - width] === TileId.Grass,
    );
    const rocks: WorldObject[] = [beach - 1, beach + 1, beach + width].map((i, n) => ({
      id: base.objects.length + n,
      kind: 'rock',
      x: i % width,
      y: Math.floor(i / width),
    }));
    const broken = withTerrain(
      { ...base, objects: [...base.objects, ...rocks] },
      (t) => (t[beach - width] = TileId.Cliff),
    );
    expect(codes(broken)).toContain('beach-cut-off');
  });

  describe('with the spawn boxed in by rocks', () => {
    const spawn = base.spawn ?? { x: 0, y: 0 };
    const fence: WorldObject[] = [
      { x: spawn.x - 1, y: spawn.y },
      { x: spawn.x + 1, y: spawn.y },
      { x: spawn.x, y: spawn.y + 1 },
    ].map((p, i) => ({ id: base.objects.length + i, kind: 'rock', ...p }));
    const fenced = { ...base, objects: [...base.objects, ...fence] };

    it('reports trails that can no longer be reached', () => {
      expect(codes(fenced)).toContain('trail-unreachable');
    });

    it('reports a too-small reachable area once no trails remain', () => {
      const trailless = withTerrain(fenced, (t) =>
        t.forEach((id, i) => {
          if (id === TileId.Path) t[i] = TileId.Grass;
          if (id === TileId.Dock) t[i] = TileId.LakeWater;
        }),
      );
      expect(codes(trailless)).toContain('reachable-area-too-small');
    });
  });
});
