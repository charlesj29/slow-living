import { describe, expect, it } from 'vitest';
import { floodFill, toIndex } from '@/shared/engine/grid';
import { ISLAND_CONFIG } from '../config';
import { computeBlockedMask } from '../world/collision';
import { OBJECT_REGISTRY } from '../world/objects';
import { TileId } from '../world/tiles';
import { villageTiles } from '../world/village';
import { getDoorFrontTile, type WorldObject } from '../world/world';
import type { GenerationContext } from './context';
import { validContext } from './testUtils';

const SEEDS = [1, 7, 13, 46, 99, 2024];
const contexts: GenerationContext[] = SEEDS.map(validContext);

function studioOf(context: GenerationContext): WorldObject {
  const studio = context.objects.find((object) => object.kind === 'studio');
  if (!studio) throw new Error('no studio');
  return studio;
}

describe('placeStudio', () => {
  it('builds exactly one studio on every valid island', () => {
    for (const context of contexts) {
      expect(context.objects.filter((object) => object.kind === 'studio')).toHaveLength(1);
    }
  });

  it('stands on land a short walk from the cottage, outside the village', () => {
    for (const context of contexts) {
      const studio = studioOf(context);
      const home = context.cabin ? getDoorFrontTile(context.cabin) : null;
      const front = getDoorFrontTile(studio);
      expect(home).not.toBeNull();
      if (!home) continue;
      const distance = Math.hypot(front.x - home.x, front.y - home.y);
      expect(distance).toBeGreaterThanOrEqual(ISLAND_CONFIG.studio.minDistanceTiles - 4);
      expect(distance).toBeLessThanOrEqual(ISLAND_CONFIG.studio.searchRadiusTiles + 8);
      const village = new Set(context.village ? villageTiles(context.village, context.size) : []);
      const { footprint } = OBJECT_REGISTRY.studio;
      for (let dy = 0; dy < footprint.height; dy++) {
        for (let dx = 0; dx < footprint.width; dx++) {
          const i = toIndex(context.size, studio.x + dx, studio.y + dy);
          expect(context.terrain[i]).toBe(TileId.Grass);
          expect(village.has(i)).toBe(false);
        }
      }
    }
  });

  it('has a path from its door that joins the island trails', () => {
    for (const context of contexts) {
      const front = getDoorFrontTile(studioOf(context));
      const start = toIndex(context.size, front.x, front.y);
      expect(context.terrain[start]).toBe(TileId.Path);
      // Following path tiles alone leads from the door into the trail network.
      const blocked = computeBlockedMask(context.size, context.terrain, context.objects);
      const onPath = floodFill(
        context.size,
        [start],
        (i) =>
          (context.terrain[i] === TileId.Path || context.terrain[i] === TileId.Dock) &&
          blocked[i] === 0,
      );
      const connectedPathTiles = context.terrain.reduce(
        (count, id, i) => count + (id === TileId.Path && onPath[i] === 1 ? 1 : 0),
        0,
      );
      expect(connectedPathTiles).toBeGreaterThan(10);
    }
  });
});
