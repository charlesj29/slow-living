// Guards the committed map file (data/island.map.json): whether it was baked or
// edited by hand, it must load and satisfy every world invariant.
import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../config';
import { validateMap } from '../generation/validate';
import { loadBakedIsland } from './bakedIsland';
import { villageHouses, villagerSpawns, villageWanderArea } from './village';
import { getDoorFrontTile } from './world';

describe('baked island', () => {
  const world = loadBakedIsland();

  it('loads at the configured size', () => {
    expect(world.width).toBe(ISLAND_CONFIG.map.widthTiles);
    expect(world.height).toBe(ISLAND_CONFIG.map.heightTiles);
  });

  it('passes every validation rule', () => {
    const snapshot = { ...world, size: { width: world.width, height: world.height } };
    expect(validateMap(snapshot, ISLAND_CONFIG.validation)).toEqual([]);
  });

  it('spawns the player in front of the cabin door', () => {
    expect(world.spawn).toEqual(getDoorFrontTile(world.cabin));
  });

  it('is the same world on every load', () => {
    const again = loadBakedIsland();
    expect(again.terrain).toEqual(world.terrain);
    expect(again.objects).toEqual(world.objects);
  });

  it('has the village: three different houses with villagers inside its area', () => {
    const houses = villageHouses(world);
    expect(houses.map((h) => h.kind).sort()).toEqual(['house_log', 'house_stone', 'house_thatch']);
    const area = villageWanderArea(world);
    expect(area).not.toBeNull();
    const spawns = villagerSpawns(world);
    expect(spawns).toHaveLength(3);
    for (const spawn of spawns) {
      expect(world.blocked[spawn.y * world.width + spawn.x]).toBe(0);
      if (area) {
        expect(spawn.x).toBeGreaterThanOrEqual(area.left);
        expect(spawn.x).toBeLessThanOrEqual(area.right);
        expect(spawn.y).toBeGreaterThanOrEqual(area.top);
        expect(spawn.y).toBeLessThanOrEqual(area.bottom);
      }
    }
  });
});
