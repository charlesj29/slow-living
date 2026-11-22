import { describe, expect, it } from 'vitest';
import { createRng } from '@/shared/engine/random';
import { ISLAND_CONFIG } from '../config';
import { createGameState, stepGame, type GameState } from '../game/gameState';
import { generateValidWorld } from '../generation/testUtils';
import { createPlayer } from '../entities/player';
import { createDuckFamily, duckWater, updateDuckFamily, type Duck } from './ducks';
import { tileAt } from './waterPaths';

const STEP = 1 / 60;
const TILE = ISLAND_CONFIG.map.tileSizePx;

function islandState(seed = 46): GameState {
  const state = createGameState(generateValidWorld(seed), ISLAND_CONFIG);
  // The player waits indoors, so the family swims undisturbed.
  Object.assign(state, { mapId: 'cottage' });
  return state;
}

const onWater = (state: GameState, duck: Duck): boolean =>
  state.duckWater.has(tileAt(state.world, duck.x, duck.y, TILE));

describe('the duck family', () => {
  it('is a mother and her ducklings, starting on the lake', () => {
    const state = islandState();
    const ducks = state.ducks?.ducks ?? [];
    expect(ducks.map((d) => d.kind)).toEqual([
      'mother',
      ...Array<string>(ISLAND_CONFIG.ducks.ducklings).fill('duckling'),
    ]);
    expect(state.duckWater.size).toBeGreaterThan(0);
  });

  it.each([46, 1, 2, 3, 7])('stays on the water and keeps together (seed %i)', (seed) => {
    const state = islandState(seed);
    let travelled = 0;
    for (let i = 0; i < 120 / STEP; i++) {
      stepGame(state, STEP, ISLAND_CONFIG);
      const [mother, ...ducklings] = state.ducks?.ducks ?? [];
      if (!mother) throw new Error('no ducks');
      travelled += Math.hypot(mother.x - mother.previousX, mother.y - mother.previousY);
      expect(onWater(state, mother), `mother at ${String(mother.x)},${String(mother.y)}`).toBe(
        true,
      );
      let ahead = mother;
      for (const duckling of ducklings) {
        expect(Math.hypot(duckling.x - ahead.x, duckling.y - ahead.y)).toBeLessThan(3 * TILE);
        ahead = duckling;
      }
    }
    // It doesn't just float in one place.
    expect(travelled).toBeGreaterThan(2 * TILE);
  });

  it('paddles away from a player who comes close', () => {
    const state = islandState();
    const family = state.ducks;
    const mother = family?.ducks[0];
    if (!family || !mother) throw new Error('no ducks');
    const player = createPlayer({ x: 0, y: 0 }, TILE);
    Object.assign(player, { x: mother.x + TILE, y: mother.y });
    const before = Math.hypot(player.x - mother.x, player.y - mother.y);
    const rng = createRng(3);
    for (let i = 0; i < 3 / STEP; i++) {
      updateDuckFamily(
        family,
        state.world,
        state.duckWater,
        player,
        rng,
        STEP,
        ISLAND_CONFIG.ducks,
        TILE,
      );
    }
    expect(Math.hypot(player.x - mother.x, player.y - mother.y)).toBeGreaterThan(before);
  });

  it('is deterministic for a seed', () => {
    const a = islandState();
    const b = islandState();
    for (let i = 0; i < 20 / STEP; i++) {
      stepGame(a, STEP, ISLAND_CONFIG);
      stepGame(b, STEP, ISLAND_CONFIG);
    }
    expect(a.ducks?.ducks.map((d) => [d.x, d.y])).toEqual(b.ducks?.ducks.map((d) => [d.x, d.y]));
  });

  it('can be switched off', () => {
    const world = generateValidWorld(46);
    const off = { ...ISLAND_CONFIG.ducks, enabled: false };
    expect(createDuckFamily(world, duckWater(world), createRng(1), off, TILE)).toBeNull();
  });
});
