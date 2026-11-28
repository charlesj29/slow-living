import { describe, expect, it } from 'vitest';
import { toIndex } from '@/shared/engine/grid';
import { ISLAND_CONFIG } from '../config';
import { createGameState, stepGame } from '../game/gameState';
import { generateValidWorld } from '../generation/testUtils';
import { chickenRun } from './animals';

const STEP = 1 / 60;
const TILE = ISLAND_CONFIG.map.tileSizePx;

function simulate(seconds: number, time = 0.4): ReturnType<typeof createGameState> {
  const state = createGameState(generateValidWorld(46), ISLAND_CONFIG);
  Object.assign(state, { timeOfDay: time });
  for (let i = 0; i < seconds / STEP; i++) stepGame(state, STEP, ISLAND_CONFIG);
  return state;
}

const tileOf = (state: ReturnType<typeof createGameState>, a: { x: number; y: number }): number =>
  toIndex(state.world, Math.floor(a.x / TILE), Math.floor(a.y / TILE));

describe('village animals', () => {
  it('can be switched off', () => {
    const off = { ...ISLAND_CONFIG, animals: { ...ISLAND_CONFIG.animals, enabled: false } };
    expect(createGameState(generateValidWorld(46), off).animals).toEqual([]);
  });

  const state = simulate(40);

  it('are three chickens and a cat', () => {
    expect(state.animals.map((a) => a.kind).sort()).toEqual([
      'cat',
      'chicken',
      'chicken',
      'chicken',
    ]);
  });

  it('chickens keep to their run; the cat to the village; nobody stands in anything solid', () => {
    const run = new Set(chickenRun(state.world)?.tiles ?? []);
    expect(run.size).toBeGreaterThan(0);
    for (const animal of state.animals) {
      const tile = tileOf(state, animal);
      if (animal.kind === 'chicken') expect(run.has(tile)).toBe(true);
      else expect(state.villageHome.has(tile)).toBe(true);
      expect(state.world.blocked[tile]).toBe(0);
    }
  });

  it('wander about (not frozen) and do the same for the same island', () => {
    const again = simulate(40);
    expect(again.animals.map((a) => [a.x, a.y])).toEqual(state.animals.map((a) => [a.x, a.y]));
    const start = createGameState(generateValidWorld(46), ISLAND_CONFIG);
    const moved = state.animals.some((a, i) => {
      const before = start.animals[i];
      return before !== undefined && (a.x !== before.x || a.y !== before.y);
    });
    expect(moved).toBe(true);
  });

  it('at night the chickens go into the hen house and the cat sleeps on its doorstep', () => {
    const night = simulate(60, 0.9);
    for (const animal of night.animals) {
      if (animal.kind === 'chicken') expect(animal.hidden).toBe(true);
      else expect(animal.pose).toBe('sleep');
    }
  });
});
