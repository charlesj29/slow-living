import { describe, expect, it } from 'vitest';
import { EIGHT_DIRECTIONS, forEachNeighbor, toIndex } from '@/shared/engine/grid';
import { ISLAND_CONFIG } from '../config';
import { OBJECT_REGISTRY, TREE_KINDS } from '../world/objects';
import { isLakeTile, TileId } from '../world/tiles';
import { NO_OBJECT } from '../world/world';
import { createInitialContext } from './context';
import { GENERATION_STEPS } from './pipeline';
import { validContext } from './testUtils';

describe('pipeline steps', () => {
  it('never mutate the context they receive', () => {
    let context = createInitialContext(31, ISLAND_CONFIG);
    for (const step of GENERATION_STEPS) {
      const terrainBefore = context.terrain.slice();
      const objectCountBefore = context.objects.length;
      const occupancyBefore = context.occupancy.slice();
      const next = step(context);
      expect(context.terrain).toEqual(terrainBefore);
      expect(context.objects).toHaveLength(objectCountBefore);
      expect(context.occupancy).toEqual(occupancyBefore);
      context = next;
    }
  });
});

describe('carveLake', () => {
  it('surrounds the lake with a shore and no grass touches lake water directly', () => {
    const context = validContext(8);
    const { size, terrain } = context;
    terrain.forEach((id, i) => {
      if (id !== TileId.LakeShallow && id !== TileId.LakeWater) return;
      forEachNeighbor(size, i, EIGHT_DIRECTIONS, (n) => {
        expect([TileId.Sand, TileId.LakeShallow, TileId.LakeWater]).toContain(terrain[n]);
      });
    });
    // Deep lake water is always ringed by shallows.
    terrain.forEach((id, i) => {
      if (id !== TileId.LakeWater) return;
      forEachNeighbor(size, i, EIGHT_DIRECTIONS, (n) => {
        expect(isLakeTile(terrain[n] ?? 0)).toBe(true);
      });
    });
  });
});

describe('placeCabin', () => {
  it('keeps the area in front of the door free of objects', () => {
    const context = validContext(13);
    const cabin = context.cabin;
    expect(cabin).not.toBeNull();
    if (!cabin) return;
    const { footprint } = OBJECT_REGISTRY.cabin;
    for (let row = 1; row <= ISLAND_CONFIG.cabin.frontClearanceTiles; row++) {
      for (let dx = 0; dx < footprint.width; dx++) {
        const index = toIndex(context.size, cabin.x + dx, cabin.y + footprint.height - 1 + row);
        expect(context.occupancy[index]).toBe(NO_OBJECT);
        expect(context.terrain[index]).toBe(TileId.Grass);
      }
    }
  });
});

describe('scatterTrees', () => {
  it('places trees only on free grass outside reserved areas', () => {
    const context = validContext(21);
    for (const object of context.objects) {
      if (!TREE_KINDS.includes(object.kind)) continue;
      const index = toIndex(context.size, object.x, object.y);
      expect(context.terrain[index]).toBe(TileId.Grass);
      expect(context.reserved[index]).toBe(0);
    }
  });

  it('groups trees into clusters rather than scattering them uniformly', () => {
    const context = validContext(34);
    const { size, terrain, objects, occupancy } = context;
    const isTree = (i: number): boolean => {
      const object = objects[occupancy[i] ?? NO_OBJECT];
      return object !== undefined && TREE_KINDS.includes(object.kind);
    };
    const grassTiles = terrain.filter((id) => id === TileId.Grass).length;
    const trees = objects.filter((o) => TREE_KINDS.includes(o.kind));
    let treeNeighbors = 0;
    for (const tree of trees) {
      forEachNeighbor(size, toIndex(size, tree.x, tree.y), EIGHT_DIRECTIONS, (n) => {
        if (isTree(n)) treeNeighbors++;
      });
    }
    const observed = treeNeighbors / trees.length;
    const expectedIfUniform = EIGHT_DIRECTIONS.length * (trees.length / grassTiles);
    expect(observed).toBeGreaterThan(expectedIfUniform * 2);
  });
});
