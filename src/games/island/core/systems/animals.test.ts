import { describe, expect, it } from 'vitest';
import { toIndex } from '@/shared/engine/grid';
import { ISLAND_CONFIG } from '../config';
import { createGameState, stepGame } from '../game/gameState';
import { generateValidWorld } from '../generation/testUtils';

const STEP = 1 / 60;
const TILE = ISLAND_CONFIG.map.tileSizePx;

function simulate(seconds: number): ReturnType<typeof createGameState> {
  const state = createGameState(generateValidWorld(46), ISLAND_CONFIG);
  for (let i = 0; i < seconds / STEP; i++) stepGame(state, STEP, ISLAND_CONFIG);
  return state;
}

describe('village animals', () => {
  const state = simulate(40);

  it('are three chickens and a cat', () => {
    expect(state.animals.map((a) => a.kind).sort()).toEqual([
      'cat',
      'chicken',
      'chicken',
      'chicken',
    ]);
  });

  it('stay inside the village and never stand in anything solid', () => {
    for (const animal of state.animals) {
      const tile = toIndex(state.world, Math.floor(animal.x / TILE), Math.floor(animal.y / TILE));
      expect(state.villageHome.has(tile)).toBe(true);
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
});
