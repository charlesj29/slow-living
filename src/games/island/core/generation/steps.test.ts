import { describe, expect, it } from 'vitest';
import {
  CARDINAL_DIRECTIONS,
  EIGHT_DIRECTIONS,
  floodFill,
  forEachNeighbor,
  toIndex,
} from '@/shared/engine/grid';
import { ISLAND_CONFIG } from '../config';
import { OBJECT_REGISTRY, TREE_KINDS } from '../world/objects';
import { isLakeTile, TileId } from '../world/tiles';
import { getDoorFrontTile, NO_OBJECT } from '../world/world';
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
  it('surrounds the lake with a shore so no grass touches lake water directly', () => {
    const context = validContext(8);
    const { size, terrain } = context;
    terrain.forEach((id, i) => {
      if (id !== TileId.LakeShallow && id !== TileId.LakeWater) return;
      forEachNeighbor(size, i, EIGHT_DIRECTIONS, (n) => {
        // Shore sand, more lake, or the dock planks that stick out into it.
        expect([TileId.Sand, TileId.LakeShallow, TileId.LakeWater, TileId.Dock]).toContain(
          terrain[n],
        );
      });
    });
    // Deep lake water is always ringed by shallows (or dock planks built over them).
    terrain.forEach((id, i) => {
      if (id !== TileId.LakeWater) return;
      forEachNeighbor(size, i, EIGHT_DIRECTIONS, (n) => {
        expect(isLakeTile(terrain[n] ?? 0) || terrain[n] === TileId.Dock).toBe(true);
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
        // Grass, or the trail that starts at the door.
        expect([TileId.Grass, TileId.Path]).toContain(context.terrain[index]);
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

describe('placeDock', () => {
  it('builds a straight dock from the lake shore into the lake', () => {
    const context = validContext(55);
    const { size, terrain } = context;
    const planks = [...terrain.keys()].filter((i) => terrain[i] === TileId.Dock);
    expect(planks).toHaveLength(ISLAND_CONFIG.dock.lengthTiles);
    const root = context.dockRoot;
    expect(root).not.toBeNull();
    if (!root) return;
    expect(terrain[toIndex(size, root.x, root.y)]).toBe(TileId.Sand);
    // Every plank touches lake water on at least two sides (it sticks out into the lake).
    for (const plank of planks) {
      let lakeNeighbors = 0;
      forEachNeighbor(size, plank, CARDINAL_DIRECTIONS, (n) => {
        if (isLakeTile(terrain[n] ?? 0)) lakeNeighbors++;
      });
      expect(lakeNeighbors).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('layPaths', () => {
  it('starts a trail at the cabin door that leads to the dock', () => {
    const context = validContext(89);
    const { size, terrain, cabin, dockRoot } = context;
    if (!cabin || !dockRoot) throw new Error('fixture needs a cabin and a dock');
    const door = getDoorFrontTile(cabin);
    expect(terrain[toIndex(size, door.x, door.y)]).toBe(TileId.Path);
    // Walk only on trail/sand/dock tiles from the door: the dock must be reachable.
    const trailTiles = new Set<number>([TileId.Path, TileId.Sand, TileId.Dock]);
    const onTrail = floodFill(size, [toIndex(size, door.x, door.y)], (i) =>
      trailTiles.has(terrain[i] ?? -1),
    );
    expect(onTrail[toIndex(size, dockRoot.x, dockRoot.y)]).toBe(1);
  });

  it('keeps trails free of objects', () => {
    const context = validContext(144);
    context.terrain.forEach((id, i) => {
      if (id === TileId.Path) expect(context.occupancy[i]).toBe(NO_OBJECT);
    });
  });
});
