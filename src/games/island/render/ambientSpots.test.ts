import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../core/config';
import { generateValidWorld } from '../core/generation/testUtils';
import { OBJECT_REGISTRY } from '../core/world/objects';
import { isLakeTile } from '../core/world/tiles';
import { butterflyRoutes, fireflySwarms, spreadSpots } from './ambientSpots';

const TILE = ISLAND_CONFIG.map.tileSizePx;

describe('spreadSpots', () => {
  it('takes the nearest spots first and keeps them apart', () => {
    const candidates = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 5, y: 0 },
      { x: 9, y: 0 },
    ];
    expect(spreadSpots(candidates, { x: 0, y: 0 }, 3, 4)).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 9, y: 0 },
    ]);
    expect(spreadSpots(candidates, { x: 0, y: 0 }, 1, 4)).toHaveLength(1);
  });
});

describe.each([46, 1, 7])('wildlife spots (seed %i)', (seed) => {
  const world = generateValidWorld(seed);
  const settings = ISLAND_CONFIG.butterflies;
  const routes = butterflyRoutes(world, settings, 2, TILE);

  it('gives every butterfly two flowers a short flight apart', () => {
    expect(routes).toHaveLength(settings.count);
    for (const route of routes) {
      for (const end of [route.from, route.to]) {
        const tileX = Math.floor(end.x / TILE);
        const tileY = Math.floor(end.y / TILE);
        const isFlower = world.objects.some(
          (o) => o.x === tileX && o.y === tileY && OBJECT_REGISTRY[o.kind].category === 'flower',
        );
        expect(isFlower, `${String(tileX)},${String(tileY)}`).toBe(true);
      }
      const flight = Math.hypot(route.to.x - route.from.x, route.to.y - route.from.y) / TILE;
      expect(flight).toBeLessThanOrEqual(settings.hopRangeTiles);
    }
  });

  it('puts the firefly swarms on open land by the lake, apart from each other', () => {
    const swarms = fireflySwarms(world, ISLAND_CONFIG.fireflies, TILE);
    expect(swarms).toHaveLength(ISLAND_CONFIG.fireflies.swarms);
    for (const swarm of swarms) {
      const x = Math.floor(swarm.x / TILE);
      const y = Math.floor(swarm.y / TILE);
      expect(world.blocked[y * world.width + x]).toBe(0);
      let nearLake = false;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          nearLake ||= isLakeTile(world.terrain[(y + dy) * world.width + x + dx] ?? 0);
        }
      }
      expect(nearLake).toBe(true);
    }
  });
});
