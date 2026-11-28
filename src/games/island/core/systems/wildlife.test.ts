import { describe, expect, it } from 'vitest';
import { createRng } from '@/shared/engine/random';
import { ISLAND_CONFIG } from '../config';
import { generateValidWorld } from '../generation/testUtils';
import { birdAreas } from './birdAreas';
import { createBirds, updateBird } from './birds';
import { createDuckFamily, duckWater, updateDuckFamily } from './ducks';
import { createPlaymates, updatePlaymates } from './playmates';
import { tileOf } from './playmateMotion';
import { createRabbits, rabbitMeadow, updateRabbit, type RabbitRest } from './rabbits';
import { roamTiles } from './routine';

const TILE = ISLAND_CONFIG.map.tileSizePx;
const STEP = 1 / 30;
const world = generateValidWorld(46);
const roam = roamTiles(world);
const steps = (seconds: number, each: () => void): void => {
  for (let i = 0; i < seconds / STEP; i++) each();
};

describe('animals in the rain and at night', () => {
  it.each<RabbitRest>(['shelter', 'sleep'])(
    'rabbits go to their spot by cover and %s there',
    (rest) => {
      const meadow = rabbitMeadow(world, ISLAND_CONFIG.rabbits);
      const rabbits = createRabbits(world, meadow, createRng(1), ISLAND_CONFIG.rabbits, TILE);
      const rng = createRng(2);
      steps(60, () => {
        for (const r of rabbits) {
          updateRabbit(r, world, meadow, null, rng, STEP, ISLAND_CONFIG.rabbits, TILE, rest);
        }
      });
      for (const r of rabbits) {
        expect(r.idle).toBe(rest === 'sleep' ? 'sleep' : 'huddle');
        expect(Math.floor(r.x / TILE)).toBe(r.shelter.x);
        expect(Math.floor(r.y / TILE)).toBe(r.shelter.y);
      }
    },
  );

  it('ducks paddle to the shore at night and sleep there', () => {
    const water = duckWater(world);
    const family = createDuckFamily(world, water, createRng(3), ISLAND_CONFIG.ducks, TILE);
    if (!family) throw new Error('no ducks');
    const rng = createRng(4);
    steps(90, () => {
      updateDuckFamily(family, world, water, null, rng, STEP, ISLAND_CONFIG.ducks, TILE, true);
    });
    expect(family.asleep).toBe(true);
    steps(1, () => {
      updateDuckFamily(family, world, water, null, rng, STEP, ISLAND_CONFIG.ducks, TILE, false);
    });
    expect(family.asleep).toBe(false);
  });

  it('birds shelter under trees in the rain, fluffed up', () => {
    const areas = birdAreas(world, roam, createRng(5), ISLAND_CONFIG.birds.areaRadiusTiles);
    const birds = createBirds(world, areas, createRng(6), ISLAND_CONFIG.birds, TILE);
    const rng = createRng(7);
    steps(20, () => {
      for (const b of birds) {
        updateBird(b, world, b.homeSet, b.home, null, rng, STEP, ISLAND_CONFIG.birds, TILE, true);
      }
    });
    for (const b of birds) {
      expect(b.idle).toBe('huddle');
      const tile = Math.floor(b.y / TILE) * world.width + Math.floor(b.x / TILE);
      if (b.shelters.length > 0) expect(b.shelterSet.has(tile)).toBe(true);
    }
  });

  it('in the rain the kid goes indoors and the puppy waits by the door', () => {
    const p = createPlaymates(world, roam, ISLAND_CONFIG.playmates, TILE);
    if (!p) throw new Error('no playmates');
    const rng = createRng(8);
    steps(20, () => updatePlaymates(p, null, 0.5, rng, STEP, ISLAND_CONFIG.playmates));
    steps(90, () => updatePlaymates(p, null, 0.5, rng, STEP, ISLAND_CONFIG.playmates, true));
    expect(p.kid.hidden).toBe(true);
    expect(p.dog.pose).toBe('sit');
    expect(tileOf(p.dog, p.ground)).toBe(p.bed);
  });
});
