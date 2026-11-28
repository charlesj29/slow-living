import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../config';
import { generateValidWorld } from '../generation/testUtils';
import { villagerSpawns } from '../world/village';
import { createGameState, stepGame } from './gameState';

/** Out of doors, the kid may stand still outside the field this long at most (seconds). */
const MAX_STUCK_SECONDS = 3;

describe('the kid goes out to play', () => {
  it.each([46, 1])(
    'never stands stuck by the house, and the puppy never sits in a doorway (seed %i)',
    (seed) => {
      const state = createGameState(generateValidWorld(seed), ISLAND_CONFIG);
      const p = state.playmates;
      if (!p) throw new Error('no playmates');
      const width = state.world.width;
      const doors = new Set(villagerSpawns(state.world).map((d) => d.y * width + d.x));
      const tileOf = (m: { x: number; y: number }): number =>
        Math.floor(m.y / 16) * width + Math.floor(m.x / 16);
      let stuck = 0;
      let worst = 0;
      let dogInDoorway = 0;
      for (let i = 0; i < 60 * 240; i++) {
        stepGame(state, 1 / 60, ISLAND_CONFIG);
        const away = !p.kid.hidden && p.mode !== 'home' && !p.playground.includes(tileOf(p.kid));
        stuck = away && !p.kid.moving ? stuck + 1 : 0;
        worst = Math.max(worst, stuck);
        if (!p.dog.moving && p.dog.pose !== 'sleep' && doors.has(tileOf(p.dog))) dogInDoorway++;
      }
      expect(worst / 60).toBeLessThan(MAX_STUCK_SECONDS);
      expect(dogInDoorway).toBe(0);
    },
  );
});
