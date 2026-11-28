import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../config';
import { createVillager } from '../entities/villager';
import { generateValidWorld } from '../generation/testUtils';
import { eveningMusician } from './eveningMusic';
import { seaDistances, soundscapeLevels, villageDistances } from './soundscape';

const TILE = ISLAND_CONFIG.map.tileSizePx;

function villager(id: number, activity: 'gather' | 'wander', atErrand: boolean) {
  const v = createVillager(id, id, { x: 5 + id, y: 5 }, [], TILE);
  v.activity = activity;
  v.atErrand = atErrand;
  return v;
}

describe('music at the evening gathering', () => {
  it('the first villager settled in at the gathering plays', () => {
    expect(eveningMusician([villager(0, 'wander', false)])).toBeNull();
    expect(eveningMusician([villager(1, 'gather', false)])).toBeNull();
    const player = eveningMusician([villager(2, 'gather', true), villager(1, 'gather', true)]);
    expect(player?.id).toBe(1);
  });

  it('the guitar is louder the nearer you are, gone far away', () => {
    const world = generateValidWorld(46);
    const distances = { sea: seaDistances(world), village: villageDistances(world) };
    const musician = { x: 40 * TILE, y: 40 * TILE };
    const at = (tiles: number): number =>
      soundscapeLevels(
        { world, x: musician.x + tiles * TILE, y: musician.y },
        0.5,
        0,
        distances,
        ISLAND_CONFIG.ambience,
        TILE,
        musician,
      ).guitar;
    expect(at(1)).toBe(1);
    expect(at(8)).toBeGreaterThan(0);
    expect(at(8)).toBeLessThan(1);
    expect(at(30)).toBe(0);
  });
});
