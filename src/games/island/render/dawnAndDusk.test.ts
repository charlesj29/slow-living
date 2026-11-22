import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../core/config';
import { generateValidWorld } from '../core/generation/testUtils';
import { isLakeTile } from '../core/world/tiles';
import { lanternThresholds, mistSpots, mistThickness } from './dawnAndDusk';

const mist = ISLAND_CONFIG.mist;
const TILE = ISLAND_CONFIG.map.tileSizePx;

describe('morning mist', () => {
  it('rises at dawn, is thickest early in the morning, and lifts by mid-morning', () => {
    expect(mistThickness(0, mist)).toBe(0);
    expect(mistThickness(mist.appears - 0.01, mist)).toBe(0);
    expect(mistThickness((mist.appears + mist.thickFrom) / 2, mist)).toBeGreaterThan(0);
    expect(mistThickness((mist.thickFrom + mist.thickUntil) / 2, mist)).toBe(1);
    expect(mistThickness((mist.thickUntil + mist.gone) / 2, mist)).toBeLessThan(1);
    expect(mistThickness(0.5, mist)).toBe(0);
  });

  it('changes gently: no jumps between nearby times', () => {
    for (let t = 0; t < 1; t += 0.001) {
      expect(Math.abs(mistThickness(t + 0.001, mist) - mistThickness(t, mist))).toBeLessThan(0.05);
    }
  });

  it.each([46, 1, 7])('lies over the lake and the meadows round it (seed %i)', (seed) => {
    const world = generateValidWorld(seed);
    const spots = mistSpots(world, mist.patches, TILE);
    expect(spots.length).toBeGreaterThanOrEqual(mist.patches - 2);
    const overLake = spots.filter((s) => {
      const i = Math.floor(s.y / TILE) * world.width + Math.floor(s.x / TILE);
      return isLakeTile(world.terrain[i] ?? 0);
    });
    expect(overLake.length).toBeGreaterThan(0);
    expect(overLake.length).toBeLessThan(spots.length);
  });
});

describe('lanterns', () => {
  it('light from the nearest to the farthest, spread over the range', () => {
    const lamps = [
      { x: 30, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ];
    expect(lanternThresholds(lamps, { x: 0, y: 0 }, { first: 0.5, last: 0.9 })).toEqual([
      0.9, 0.5, 0.7,
    ]);
  });
});
