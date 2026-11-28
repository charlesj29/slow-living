import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../core/config';
import { generateValidWorld } from '../core/generation/testUtils';
import { isLakeTile } from '../core/world/tiles';
import { fishJumpAt, leapSpots, SPLASH_SECONDS } from './fishJumps';

const TILE = ISLAND_CONFIG.map.tileSizePx;
const settings = ISLAND_CONFIG.lakeLife;
const world = generateValidWorld(46);
const spots = leapSpots(world, TILE);

describe('leaping fish', () => {
  it('leap from open lake water', () => {
    expect(spots.length).toBeGreaterThan(0);
    for (const s of spots) {
      expect(
        isLakeTile(
          world.terrain[Math.floor(s.y / TILE) * world.width + Math.floor(s.x / TILE)] ?? 0,
        ),
      ).toBe(true);
    }
  });

  it('leap once in each stretch, then splash', () => {
    const every = settings.fishJumpEverySeconds;
    const step = 0.02;
    let airborne = 0;
    let splashing = 0;
    for (let t = 0; t < every * 10; t += step) {
      const jump = fishJumpAt(t, spots, settings);
      if (!jump) continue;
      if (jump.progress < 1) airborne += step;
      else splashing += step;
    }
    expect(airborne).toBeCloseTo(10 * settings.fishJumpSeconds, 0);
    expect(splashing).toBeCloseTo(10 * SPLASH_SECONDS, 0);
  });
});
