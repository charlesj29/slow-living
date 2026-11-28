import { describe, expect, it } from 'vitest';
import { toIndex } from '@/shared/engine/grid';
import { ISLAND_CONFIG } from '../../config';
import { TileId } from '../../world/tiles';
import { villageHouses, villageTiles } from '../../world/village';
import { getDoorFrontTile } from '../../world/world';
import { generateValidWorld } from '../testUtils';
import { hangLaundry } from './hangLaundry';
import { createInitialContext } from '../context';
import { GENERATION_STEPS } from '../pipeline';

describe('washing lines', () => {
  it.each([46, 1, 2, 3, 7, 12])('hang inside the village on open grass (seed %i)', (seed) => {
    const world = generateValidWorld(seed);
    const lines = world.objects.filter((o) => o.kind === 'laundry_line');
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(ISLAND_CONFIG.village.laundryLines);
    const inside = new Set(world.village ? villageTiles(world.village, world) : []);
    const doors = villageHouses(world).map(getDoorFrontTile);
    for (const line of lines) {
      for (let dx = 0; dx < 3; dx++) {
        const i = toIndex(world, line.x + dx, line.y);
        expect(inside.has(i)).toBe(true);
        expect(world.terrain[i]).toBe(TileId.Grass);
        for (const door of doors) expect(door.x === line.x + dx && door.y === line.y).toBe(false);
      }
    }
  });

  it('are added last: everything else on the island stays where it was', () => {
    const steps = GENERATION_STEPS.filter((step) => step !== hangLaundry);
    const without = steps.reduce((c, step) => step(c), createInitialContext(46, ISLAND_CONFIG));
    const withLines = GENERATION_STEPS.reduce(
      (c, step) => step(c),
      createInitialContext(46, ISLAND_CONFIG),
    );
    // (Compared by kind and place: ids are list positions, which later steps may renumber.)
    const where = (objects: readonly { kind: string; x: number; y: number }[]): string[] =>
      objects.map((o) => `${o.kind}@${String(o.x)},${String(o.y)}`);
    const others = withLines.objects.filter((o) => o.kind !== 'laundry_line');
    expect(where(others)).toEqual(where(without.objects));
    expect(withLines.terrain).toEqual(without.terrain);
    expect(withLines.spawn).toEqual(without.spawn);
  });
});
