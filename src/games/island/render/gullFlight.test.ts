import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../core/config';
import { generateValidWorld } from '../core/generation/testUtils';
import { getTileDefinition } from '../core/world/tiles';
import { gullPose, gullSpots } from './gullFlight';

const TILE = ISLAND_CONFIG.map.tileSizePx;
const settings = ISLAND_CONFIG.birds;
const world = generateValidWorld(46);

describe('seagulls', () => {
  it('circle over the sea off the coast', () => {
    const spots = gullSpots(world, settings.gulls, TILE);
    expect(spots).toHaveLength(settings.gulls);
    for (const s of spots) {
      const tile = world.terrain[Math.floor(s.y / TILE) * world.width + Math.floor(s.x / TILE)];
      expect(getTileDefinition(tile ?? 0).waterBody).toBe('sea');
    }
  });

  it('loop round their spot and flap now and then', () => {
    const [spot] = gullSpots(world, 1, TILE);
    if (!spot) throw new Error('no gull');
    const poses = Array.from({ length: 600 }, (_, i) => gullPose(spot, i * 0.05, settings));
    for (const p of poses) {
      expect(Math.hypot(p.x - spot.x, p.y - spot.y)).toBeLessThanOrEqual(
        settings.gullLoopPx + 0.01,
      );
    }
    expect(poses.some((p) => p.flapping)).toBe(true);
    expect(poses.some((p) => !p.flapping)).toBe(true);
  });
});
