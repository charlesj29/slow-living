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
import { villageTiles } from '../world/village';
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
  it('keeps scattered trees and rocks out of the front yard and the door step clear', () => {
    const context = validContext(13);
    const cabin = context.cabin;
    if (!cabin) throw new Error('fixture needs a cabin');
    const { footprint } = OBJECT_REGISTRY.cabin;
    // Only the yard's own furnishings (decorateCabin) stand there.
    const yardKinds = new Set([
      'fence',
      'mailbox',
      'bush',
      'flower_pot',
      'barrel',
      'sign',
      'stepping_stone',
    ]);
    for (let row = 1; row <= ISLAND_CONFIG.cabin.frontClearanceTiles; row++) {
      for (let dx = -1; dx <= footprint.width; dx++) {
        const index = toIndex(context.size, cabin.x + dx, cabin.y + footprint.height - 1 + row);
        const object = context.objects[context.occupancy[index] ?? NO_OBJECT];
        if (object) expect(yardKinds.has(object.kind), object.kind).toBe(true);
      }
    }
    const door = getDoorFrontTile(cabin);
    expect(context.occupancy[toIndex(context.size, door.x, door.y)]).toBe(NO_OBJECT);
  });
});

describe('decorateCabin', () => {
  it('fences the front yard and puts a mailbox next to the door', () => {
    const context = validContext(13);
    const kinds = context.objects.map((o) => o.kind);
    expect(kinds.filter((k) => k === 'fence').length).toBeGreaterThan(3);
    expect(kinds.filter((k) => k === 'mailbox')).toHaveLength(1);
    for (const object of context.objects) {
      if (object.kind !== 'fence') continue;
      // Fences never sit on a trail, so they can't block the way out.
      expect(context.terrain[toIndex(context.size, object.x, object.y)]).toBe(TileId.Grass);
    }
  });
});

describe('scatterTrees', () => {
  it('mixes big 2×2 trees with small trees and bushes', () => {
    const kinds = validContext(21).objects.map((o) => o.kind);
    for (const kind of ['tree_oak', 'tree_pine', 'tree_small'] as const) {
      expect(kinds.filter((k) => k === kind).length, kind).toBeGreaterThan(10);
    }
    // Bushes are rarer (and the village clears its patch of the island).
    expect(kinds.filter((k) => k === 'bush').length).toBeGreaterThanOrEqual(5);
  });

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

  it('keeps trails free of objects (only the village plaza has its well and string lights)', () => {
    const context = validContext(144);
    context.terrain.forEach((id, i) => {
      if (id !== TileId.Path) return;
      const kind = context.objects[context.occupancy[i] ?? NO_OBJECT]?.kind;
      if (kind) expect(['well', 'string_lights']).toContain(kind);
    });
  });
});

describe('house props', () => {
  it('furnish the yard on free grass inside the cabin area, never on the trail', () => {
    const context = validContext(13);
    const props = context.objects.filter((o) =>
      ['barrel', 'flower_pot', 'sign', 'wood_pile', 'stepping_stone'].includes(o.kind),
    );
    expect(props.length).toBeGreaterThan(2);
    for (const prop of props) {
      const index = toIndex(context.size, prop.x, prop.y);
      expect(context.terrain[index], prop.kind).toBe(TileId.Grass);
      expect(context.reserved[index], prop.kind).toBe(1);
    }
  });
});

describe('placeLedges', () => {
  const contexts = [13, 2024, 7, 99].map(validContext);

  it('puts some ledges on the island', () => {
    const ledges = contexts.map((c) => c.terrain.filter((id) => id === TileId.Cliff).length);
    expect(Math.max(...ledges)).toBeGreaterThan(0);
  });

  it('only builds ledges between grass above and beach below, in runs, away from trails and water', () => {
    for (const context of contexts) {
      const { size, terrain } = context;
      const at = (x: number, y: number): number | undefined => terrain[toIndex(size, x, y)];
      for (let y = 1; y < size.height - 1; y++) {
        let run = 0;
        for (let x = 1; x < size.width; x++) {
          if (at(x, y) !== TileId.Cliff) {
            if (run > 0) expect(run).toBeGreaterThanOrEqual(ISLAND_CONFIG.ledges.minRunTiles);
            run = 0;
            continue;
          }
          run++;
          expect(at(x, y - 1)).toBe(TileId.Grass);
          expect(at(x, y + 1)).toBe(TileId.Sand);
          for (const side of [at(x - 1, y), at(x + 1, y)]) {
            expect([TileId.Grass, TileId.Sand, TileId.Cliff]).toContain(side);
          }
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) expect(at(x + dx, y + dy)).not.toBe(TileId.Path);
          }
        }
      }
    }
  });
});

describe('scatterDeadwood', () => {
  it('drops stumps and branches on free grass among trees, outside the cabin area', () => {
    const context = validContext(13);
    const { size } = context;
    const radius = ISLAND_CONFIG.deadwood.searchRadiusTiles;
    // The village's own decorative stumps are placed by placeVillage, not here.
    const villageInside = new Set(
      context.village ? villageTiles(context.village, context.size) : [],
    );
    const inVillage = (o: { x: number; y: number }): boolean =>
      villageInside.has(toIndex(context.size, o.x, o.y));
    const deadwood = context.objects.filter(
      (o) => (o.kind === 'stump' || o.kind === 'branch') && !inVillage(o),
    );
    expect(deadwood.length).toBeGreaterThan(0);
    for (const piece of deadwood) {
      const index = toIndex(size, piece.x, piece.y);
      expect(context.terrain[index]).toBe(TileId.Grass);
      expect(context.reserved[index]).toBe(0);
      const trees = new Set<number>();
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const id = context.occupancy[toIndex(size, piece.x + dx, piece.y + dy)] ?? NO_OBJECT;
          const kind = context.objects[id]?.kind;
          if (kind && TREE_KINDS.includes(kind)) trees.add(id);
        }
      }
      expect(trees.size).toBeGreaterThanOrEqual(ISLAND_CONFIG.deadwood.minNearbyTrees);
    }
  });
});
