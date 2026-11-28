import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../config';
import { generateValidWorld } from '../generation/testUtils';
import { createGameState, stepGame } from './gameState';

describe('chickens in the rain', () => {
  it.each([3068120830, 46, 1, 7])('all huddle down when a shower starts (seed %i)', (seed) => {
    const state = createGameState(generateValidWorld(seed), ISLAND_CONFIG);
    // The player waits indoors, so only the chickens themselves can get in each other's way.
    Object.assign(state, { timeOfDay: 0.45, mapId: 'cottage' });
    for (let i = 0; i < 60 * 20; i++) stepGame(state, 1 / 60, ISLAND_CONFIG);
    Object.assign(state.weather, { raining: true, intensity: 1, timeLeft: 1e9 });
    for (let i = 0; i < 60 * 25; i++) stepGame(state, 1 / 60, ISLAND_CONFIG);
    for (const chicken of state.animals.filter((a) => a.kind === 'chicken')) {
      expect(chicken.pose).toBe('huddle');
    }
  });
});
