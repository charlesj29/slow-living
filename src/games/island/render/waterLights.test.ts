import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../core/config';
import { generateValidWorld } from '../core/generation/testUtils';
import { getTileDefinition, isLakeTile } from '../core/world/tiles';
import { glintSpots, moonSpot, shootingStarAt, starSpots, twinkle, within } from './waterLights';

const TILE = ISLAND_CONFIG.map.tileSizePx;
const settings = ISLAND_CONFIG.waterLights;
const world = generateValidWorld(46);
const tileAt = (x: number, y: number): number =>
  world.terrain[Math.floor(y / TILE) * world.width + Math.floor(x / TILE)] ?? 0;

describe('light on the water', () => {
  it('knows night, dawn and dusk (night wraps past midnight)', () => {
    expect(within(0.9, settings.night)).toBe(true);
    expect(within(0.1, settings.night)).toBe(true);
    expect(within(0.5, settings.night)).toBe(false);
    expect(within(0.25, settings.dawn)).toBe(true);
    expect(within(0.75, settings.dusk)).toBe(true);
  });

  it('puts the stars on water, the sparkles and the moon on the lake', () => {
    const stars = starSpots(world, settings, TILE);
    expect(stars).toHaveLength(settings.stars + settings.lakeStars);
    expect(stars.filter((s) => isLakeTile(tileAt(s.x, s.y)))).toHaveLength(settings.lakeStars);
    for (const s of stars) expect(getTileDefinition(tileAt(s.x, s.y)).waterBody).not.toBeNull();
    for (const g of glintSpots(world, settings, TILE)) {
      expect(isLakeTile(tileAt(g.x, g.y))).toBe(true);
    }
    const moon = moonSpot(world, TILE);
    expect(moon && isLakeTile(tileAt(moon.x, moon.y))).toBe(true);
  });

  it('is the same for the same island', () => {
    expect(starSpots(world, settings, TILE)).toEqual(starSpots(world, settings, TILE));
  });

  it('twinkles: bright, dim and out in turn', () => {
    const seen = new Set(Array.from({ length: 30 }, (_, i) => twinkle(i * 0.1, 0, 3)));
    expect(seen).toEqual(new Set(['bright', 'dim', 'off']));
  });

  it('sends one shooting star now and then, never two at once', () => {
    const every = settings.shootingStarEverySeconds;
    const step = 0.05;
    let flying = 0;
    const seen = new Set<number>();
    for (let t = 0; t < every * 10; t += step) {
      const star = shootingStarAt(t, settings);
      if (!star) continue;
      flying += step;
      seen.add(star.index);
    }
    expect(seen.size).toBe(10);
    expect(flying).toBeCloseTo(10 * settings.shootingStarSeconds, 0);
  });
});
