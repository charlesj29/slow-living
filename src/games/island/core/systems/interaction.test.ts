import { describe, expect, it } from 'vitest';
import { pressKey, releaseKey } from '@/shared/engine/input';
import { ISLAND_CONFIG } from '../config';
import { createPlayer, type Direction } from '../entities/player';
import { createGameState, stepGame } from '../game/gameState';
import { ISLAND_KEY_BINDINGS } from './controls';
import { findInteractTarget } from './interaction';
import { makeTestWorld, TEST_TILE } from './testWorld';

const STEP = 1 / 60;
const REACH = ISLAND_CONFIG.interaction.reachPx;
/** A meadow with a mailbox at (2, 1) and a rock at (4, 1). */
const world = makeTestWorld(
  Array.from({ length: 5 }, () => ',,,,,,'),
  [
    { kind: 'mailbox', x: 2, y: 1 },
    { kind: 'rock', x: 4, y: 1 },
  ],
);

function playerAt(
  tileX: number,
  tileY: number,
  facing: Direction,
): ReturnType<typeof createPlayer> {
  const player = createPlayer({ x: tileX, y: tileY }, TEST_TILE);
  player.facing = facing;
  return player;
}

function tapE(state: ReturnType<typeof createGameState>): void {
  pressKey(state.input, ISLAND_KEY_BINDINGS, 'KeyE');
  stepGame(state, STEP, ISLAND_CONFIG);
  releaseKey(state.input, ISLAND_KEY_BINDINGS, 'KeyE');
}

describe('interaction', () => {
  it('finds the mailbox when standing next to it and facing it', () => {
    const target = findInteractTarget(
      world,
      playerAt(2, 2, 'up'),
      ISLAND_CONFIG.player,
      REACH,
      TEST_TILE,
    );
    expect(target?.object.kind).toBe('mailbox');
    expect(target?.message).toBe("It's empty.");
  });

  it('finds nothing when facing away or when the thing has nothing to say', () => {
    expect(
      findInteractTarget(world, playerAt(2, 2, 'down'), ISLAND_CONFIG.player, REACH, TEST_TILE),
    ).toBeNull();
    expect(
      findInteractTarget(world, playerAt(4, 2, 'up'), ISLAND_CONFIG.player, REACH, TEST_TILE),
    ).toBeNull();
  });

  it('opens the message with E, holds the player still, and closes it with E', () => {
    const state = createGameState(world, ISLAND_CONFIG);
    Object.assign(state.player, playerAt(2, 2, 'up'));
    stepGame(state, STEP, ISLAND_CONFIG);
    expect(state.interactTarget?.object.kind).toBe('mailbox');

    tapE(state);
    expect(state.dialog).toEqual({ message: "It's empty." });

    const y = state.player.y;
    pressKey(state.input, ISLAND_KEY_BINDINGS, 'ArrowDown');
    for (let i = 0; i < 10; i++) stepGame(state, STEP, ISLAND_CONFIG);
    expect(state.player.y).toBe(y);
    releaseKey(state.input, ISLAND_KEY_BINDINGS, 'ArrowDown');

    tapE(state);
    expect(state.dialog).toBeNull();
  });

  it('ignores E with nothing in reach', () => {
    const state = createGameState(world, ISLAND_CONFIG);
    Object.assign(state.player, playerAt(0, 4, 'right'));
    tapE(state);
    expect(state.dialog).toBeNull();
  });
});
