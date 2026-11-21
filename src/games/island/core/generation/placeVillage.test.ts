import { describe, expect, it } from 'vitest';
import { CARDINAL_DIRECTIONS, toIndex } from '@/shared/engine/grid';
import { OBJECT_REGISTRY } from '../world/objects';
import { TileId } from '../world/tiles';
import { villageHouses, villageTiles } from '../world/village';
import { getDoorFrontTile } from '../world/world';
import type { GenerationContext } from './context';
import { validContext } from './testUtils';

const SEEDS = [1, 7, 13, 99, 2024, 31, 5, 42];
const contexts: GenerationContext[] = SEEDS.map(validContext);
/** Plaza furnishings that may stand on its paving (the well) or over it (string lights). */
const ON_PAVING = new Set(['well', 'string_lights']);

const kindAt = (context: GenerationContext, index: number): string | undefined =>
  context.objects[context.occupancy[index] ?? -1]?.kind;

describe('placeVillage', () => {
  it('builds the village on every valid island', () => {
    for (const context of contexts) expect(context.village).not.toBeNull();
  });

  it('is open: no fence runs along the edge of the village', () => {
    for (const context of contexts) {
      const village = context.village;
      if (!village) continue;
      const inside = new Set(villageTiles(village, context.size));
      let edgeFences = 0;
      let edgeTiles = 0;
      for (const tile of inside) {
        const x = tile % context.size.width;
        const y = Math.floor(tile / context.size.width);
        for (const { x: dx, y: dy } of CARDINAL_DIRECTIONS) {
          const n = toIndex(context.size, x + dx, y + dy);
          if (inside.has(n)) continue;
          edgeTiles++;
          if (kindAt(context, n) === 'fence') edgeFences++;
        }
      }
      expect(edgeFences).toBe(0);
      expect(edgeTiles).toBeGreaterThan(0);
    }
  });

  it('has a paved plaza with the well, and a path from every door', () => {
    for (const context of contexts) {
      expect(context.objects.some((o) => o.kind === 'well')).toBe(true);
      for (const house of villageHouses(context)) {
        const front = getDoorFrontTile(house);
        expect(context.terrain[toIndex(context.size, front.x, front.y)]).toBe(TileId.Path);
      }
    }
  });

  it('gives most houses a little front garden fence, with a gap at the door path', () => {
    let gardens = 0;
    let houses = 0;
    for (const context of contexts) {
      for (const house of villageHouses(context)) {
        houses++;
        const { footprint } = OBJECT_REGISTRY[house.kind];
        const front = getDoorFrontTile(house);
        const row = house.y + footprint.height + 1;
        const fenced = kindAt(context, toIndex(context.size, house.x, row)) === 'fence';
        if (!fenced) continue;
        gardens++;
        expect(kindAt(context, toIndex(context.size, front.x, row))).toBeUndefined();
      }
    }
    expect(gardens).toBeGreaterThanOrEqual(Math.ceil(houses * 0.6));
  });

  it('livens the plaza up: a market stall or benches on most islands', () => {
    const lively = contexts.filter((c) =>
      c.objects.some((o) => o.kind === 'market_stall' || o.kind === 'bench'),
    );
    expect(lively.length).toBeGreaterThanOrEqual(Math.ceil(contexts.length * 0.75));
  });

  it('keeps paths clear, apart from the plaza furnishings', () => {
    for (const context of contexts) {
      context.terrain.forEach((id, i) => {
        if (id !== TileId.Path) return;
        const kind = kindAt(context, i);
        if (kind) expect(ON_PAVING.has(kind), kind).toBe(true);
      });
    }
  });

  it('records the entrance on the path where it leaves the village', () => {
    for (const context of contexts) {
      const village = context.village;
      if (!village) continue;
      const gate = toIndex(context.size, village.gate.x, village.gate.y);
      expect(context.terrain[gate]).toBe(TileId.Path);
      expect(new Set(villageTiles(village, context.size)).has(gate)).toBe(true);
    }
  });

  it('varies its shape from seed to seed and stays the same for one seed', () => {
    const sizes = new Set(contexts.map((c) => c.village?.interior.length));
    expect(sizes.size).toBeGreaterThan(1);
    expect(validContext(SEEDS[0] ?? 1).village).toEqual(contexts[0]?.village);
  });
});
