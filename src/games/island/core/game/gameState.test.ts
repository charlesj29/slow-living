import { describe, expect, it } from 'vitest';
import { pressKey, releaseKey } from '@/shared/engine/input';
import { ISLAND_CONFIG } from '../config';
import { playerFrameIndex } from '../systems/animation';
import { ISLAND_KEY_BINDINGS, readMovementIntent } from '../systems/controls';
import { makeTestWorld, TEST_TILE } from '../systems/testWorld';
import { loadBakedIsland } from '../world/bakedIsland';
import { advanceGame, createGameState, interpolatedPlayerPosition, stepGame } from './gameState';

const open = (): ReturnType<typeof makeTestWorld> =>
  makeTestWorld(Array.from({ length: 10 }, () => ',,,,,,,,,,'));

describe('controls', () => {
  it('turns held keys into a movement intent', () => {
    const state = createGameState(open(), ISLAND_CONFIG);
    pressKey(state.input, ISLAND_KEY_BINDINGS, 'KeyD');
    pressKey(state.input, ISLAND_KEY_BINDINGS, 'ArrowUp');
    pressKey(state.input, ISLAND_KEY_BINDINGS, 'ShiftLeft');
    expect(readMovementIntent(state.input)).toEqual({ dx: 1, dy: -1, run: true, facing: 'up' });
  });

  it('cancels opposite directions but still faces the latest one', () => {
    const state = createGameState(open(), ISLAND_CONFIG);
    pressKey(state.input, ISLAND_KEY_BINDINGS, 'ArrowLeft');
    pressKey(state.input, ISLAND_KEY_BINDINGS, 'ArrowRight');
    expect(readMovementIntent(state.input)).toMatchObject({ dx: 0, facing: 'right' });
  });
});

describe('game state', () => {
  it('spawns the player in the middle of the spawn tile, facing down', () => {
    const world = loadBakedIsland();
    const { player } = createGameState(world, ISLAND_CONFIG);
    expect(player.x).toBe((world.spawn.x + 0.5) * TEST_TILE);
    expect(player.y).toBe((world.spawn.y + 0.5) * TEST_TILE);
    expect(player.facing).toBe('down');
  });

  it('faces and walks in the pressed direction, then stops and stands', () => {
    const state = createGameState(open(), ISLAND_CONFIG);
    pressKey(state.input, ISLAND_KEY_BINDINGS, 'KeyA');
    const startX = state.player.x;
    for (let i = 0; i < 10; i++) stepGame(state, 1 / 60, ISLAND_CONFIG);
    expect(state.player.facing).toBe('left');
    expect(state.player.x).toBeLessThan(startX);
    expect(playerFrameIndex(state.player, ISLAND_CONFIG.player)).not.toBe(-1);
    releaseKey(state.input, ISLAND_KEY_BINDINGS, 'KeyA');
    stepGame(state, 1 / 60, ISLAND_CONFIG);
    expect(state.player.moving).toBe(false);
    expect(playerFrameIndex(state.player, ISLAND_CONFIG.player)).toBe(0);
    expect(state.player.facing).toBe('left');
  });

  it('ends up in the same place at any frame rate', () => {
    const run = (fps: number): { x: number; y: number } => {
      const state = createGameState(open(), ISLAND_CONFIG);
      pressKey(state.input, ISLAND_KEY_BINDINGS, 'ArrowDown');
      pressKey(state.input, ISLAND_KEY_BINDINGS, 'ArrowRight');
      for (let i = 0; i < fps; i++) advanceGame(state, 1 / fps, ISLAND_CONFIG);
      return { x: state.player.x, y: state.player.y };
    };
    expect(run(144)).toEqual(run(60));
    expect(run(30)).toEqual(run(60));
  });

  it('interpolates the rendered position between steps', () => {
    const state = createGameState(open(), ISLAND_CONFIG);
    pressKey(state.input, ISLAND_KEY_BINDINGS, 'ArrowRight');
    advanceGame(state, 1 / 60, ISLAND_CONFIG);
    advanceGame(state, 0.5 / 60, ISLAND_CONFIG);
    const { x } = interpolatedPlayerPosition(state);
    expect(x).toBeGreaterThan(state.player.previousX);
    expect(x).toBeLessThan(state.player.x);
  });
});
