import { describe, expect, it } from 'vitest';
import { pressKey, releaseKey } from '@/shared/engine/input';
import { ISLAND_CONFIG } from '../config';
import { createGameState, stepGame, tapAt, type GameState } from '../game/gameState';
import { PLAYER_FRAMES, playerFrameIndex } from './animation';
import { ISLAND_KEY_BINDINGS } from './controls';
import { makeTestWorld, TEST_TILE } from './testWorld';

const STEP = 1 / 60;
/** A meadow with a bench at (3, 3)–(4, 3). */
const world = makeTestWorld(
  Array.from({ length: 8 }, () => ',,,,,,,,'),
  [{ kind: 'bench', x: 3, y: 3 }],
);

function press(state: GameState, code: string, steps = 1): void {
  pressKey(state.input, ISLAND_KEY_BINDINGS, code);
  for (let i = 0; i < steps; i++) stepGame(state, STEP, ISLAND_CONFIG);
  releaseKey(state.input, ISLAND_KEY_BINDINGS, code);
}

function inFrontOfBench(): GameState {
  const state = createGameState(world, ISLAND_CONFIG);
  Object.assign(state.player, { x: 3.5 * TEST_TILE, y: 4.4 * TEST_TILE, facing: 'up' });
  stepGame(state, STEP, ISLAND_CONFIG);
  return state;
}

describe('sitting on a bench', () => {
  it('Space sits down on the bench, facing out, in the sitting pose', () => {
    const state = inFrontOfBench();
    press(state, 'Space');
    expect(state.player.sitting).not.toBeNull();
    expect(Math.floor(state.player.x / TEST_TILE)).toBe(3);
    expect(state.player.facing).toBe('down');
    expect(state.dialog).toBeNull();
    expect(playerFrameIndex(state.player, ISLAND_CONFIG.player)).toBe(PLAYER_FRAMES.sit);
  });

  it('stays seated when walking keys are pressed; Space stands up where it was', () => {
    const state = inFrontOfBench();
    const before = { x: state.player.x, y: state.player.y };
    press(state, 'Space');
    for (let i = 0; i < 30; i++) stepGame(state, STEP, ISLAND_CONFIG);
    press(state, 'ArrowLeft', 20);
    press(state, 'KeyW', 20);
    expect(state.player.sitting).not.toBeNull();
    press(state, 'Space');
    expect(state.player.sitting).toBeNull();
    expect({ x: state.player.x, y: state.player.y }).toEqual(before);
  });

  it('Space or a tap stands up too', () => {
    const state = inFrontOfBench();
    press(state, 'Space');
    press(state, 'Space');
    expect(state.player.sitting).toBeNull();
    press(state, 'Space');
    tapAt(state, { x: 0, y: 0 }, ISLAND_CONFIG);
    expect(state.player.sitting).toBeNull();
  });

  it('tapping a bench walks up to it and sits down', () => {
    const state = createGameState(world, ISLAND_CONFIG);
    Object.assign(state.player, { x: 6.5 * TEST_TILE, y: 6.5 * TEST_TILE });
    tapAt(state, { x: 3.5 * TEST_TILE, y: 3.5 * TEST_TILE }, ISLAND_CONFIG);
    for (let i = 0; i < 4 / STEP; i++) stepGame(state, STEP, ISLAND_CONFIG);
    expect(state.player.sitting).not.toBeNull();
  });
});
