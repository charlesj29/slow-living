import { describe, expect, it } from 'vitest';
import { CARDINAL_DIRECTIONS, toIndex } from '@/shared/engine/grid';
import { ISLAND_CONFIG } from '../config';
import { OBJECT_REGISTRY } from '../world/objects';
import { TileId } from '../world/tiles';
import { villageHouses, villageTiles } from '../world/village';
import type { GenerationContext } from './context';
import { validContext } from './testUtils';

const SEEDS = [1, 7, 13, 99, 2024, 31, 5, 42];
const contexts: GenerationContext[] = SEEDS.map(validContext);
const withVillage = contexts.filter((c) => c.village !== null);

function fenceAt(context: GenerationContext, index: number): boolean {
  const object = context.objects[context.occupancy[index] ?? -1];
  return object?.kind === 'fence';
}

describe('placeVillage', () => {
  it('builds a village for most seeds', () => {
    expect(withVillage.length).toBeGreaterThanOrEqual(SEEDS.length - 2);
  });

  it('fences the inside all round, with exactly one gap: the gate, on a path', () => {
    for (const context of withVillage) {
      const village = context.village;
      if (!village) continue;
      const inside = new Set(villageTiles(village, context.size));
      const gate = toIndex(context.size, village.gate.x, village.gate.y);
      expect(context.terrain[gate]).toBe(TileId.Path);
      for (const tile of inside) {
        const x = tile % context.size.width;
        const y = Math.floor(tile / context.size.width);
        for (const { x: dx, y: dy } of CARDINAL_DIRECTIONS) {
          const n = toIndex(context.size, x + dx, y + dy);
          expect(inside.has(n) || fenceAt(context, n) || n === gate).toBe(true);
        }
      }
    }
  });

  it('keeps at least two tiles of open ground between the houses and the fence', () => {
    for (const context of withVillage) {
      for (const house of villageHouses(context)) {
        const { footprint } = OBJECT_REGISTRY[house.kind];
        for (let y = house.y - 2; y < house.y + footprint.height + 2; y++) {
          for (let x = house.x - 2; x < house.x + footprint.width + 2; x++) {
            expect(fenceAt(context, toIndex(context.size, x, y))).toBe(false);
          }
        }
      }
    }
  });

  it('never puts a decoration on a path', () => {
    for (const context of withVillage) {
      const inside = new Set(context.village ? villageTiles(context.village, context.size) : []);
      for (const tile of inside) {
        if (context.terrain[tile] !== TileId.Path) continue;
        expect(context.occupancy[tile]).toBe(-1);
      }
    }
  });

  it('varies the outline and where the gate is from seed to seed', () => {
    const sizes = new Set(withVillage.map((c) => c.village?.interior.length));
    expect(sizes.size).toBeGreaterThan(1);
    const sides = new Set(
      withVillage.map((c) => {
        const village = c.village;
        if (!village) return 'none';
        const ys = village.interior.map(([y]) => y);
        const xs = village.interior.flatMap(([, l, r]) => [l, r]);
        const { x, y } = village.gate;
        if (x < Math.min(...xs)) return 'left';
        if (x > Math.max(...xs)) return 'right';
        return y < Math.min(...ys) ? 'top' : 'bottom';
      }),
    );
    expect(sides.size).toBeGreaterThan(1);
  });

  it('is the same village every time for the same seed', () => {
    const again = validContext(SEEDS[0] ?? 1);
    expect(again.village).toEqual(contexts[0]?.village);
  });

  it('fits the configured gap rule', () => {
    expect(ISLAND_CONFIG.village.gapTiles.min).toBeGreaterThanOrEqual(2);
  });
});
