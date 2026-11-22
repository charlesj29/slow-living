import { describe, expect, it } from 'vitest';
import { pressKey, releaseKey } from '@/shared/engine/input';
import { ISLAND_CONFIG } from '../config';
import { createGameState, stepGame, tapAt, type GameState } from '../game/gameState';
import { buildInteriorWorld, INTERIORS } from '../world/interiors';
import { ISLAND_KEY_BINDINGS } from './controls';
import { makeTestWorld, TEST_TILE } from './testWorld';

const STEP = 1 / 60;
/** A meadow with the cottage at (1, 1) (door (3, 4)), a mailbox at (8, 2) and a rock at (8, 6). */
const world = makeTestWorld(
  Array.from({ length: 10 }, () => ',,,,,,,,,,,,'),
  [
    { kind: 'cabin', x: 1, y: 1 },
    { kind: 'mailbox', x: 8, y: 2 },
    { kind: 'rock', x: 8, y: 6 },
  ],
);

function stateAt(tileX: number, tileY: number): GameState {
  const state = createGameState(world, ISLAND_CONFIG);
  Object.assign(state.player, { x: (tileX + 0.5) * TEST_TILE, y: (tileY + 0.5) * TEST_TILE });
  return state;
}

/** A tap in the middle of a tile. */
function tap(state: GameState, tileX: number, tileY: number): void {
  tapAt(state, { x: (tileX + 0.5) * TEST_TILE, y: (tileY + 0.5) * TEST_TILE }, ISLAND_CONFIG);
}

function run(state: GameState, seconds: number): void {
  for (let i = 0; i < seconds / STEP; i++) stepGame(state, STEP, ISLAND_CONFIG);
}

const tileOf = (state: GameState): [number, number] => [
  Math.floor(state.player.x / TEST_TILE),
  Math.floor(state.player.y / TEST_TILE),
];

describe('tap to walk', () => {
  it('walks to a tapped open tile, around obstacles', () => {
    const state = stateAt(9, 8);
    tap(state, 8, 4); // the rock at (8, 6) is in the straight line
    run(state, 3);
    expect(tileOf(state)).toEqual([8, 4]);
    expect(state.autoWalk).toBeNull();
  });

  it('walks up to a tapped mailbox, faces it and reads it', () => {
    const state = stateAt(11, 8);
    tap(state, 8, 2);
    run(state, 4);
    expect(state.dialog?.pages).toEqual(["It's empty."]);
  });

  it('counts a tap just above the mailbox (its top) as the mailbox', () => {
    const state = stateAt(11, 8);
    tap(state, 8, 1);
    run(state, 4);
    expect(state.dialog?.pages).toEqual(["It's empty."]);
  });

  it('walks to the cottage door and goes in when the cottage is tapped', () => {
    const state = stateAt(10, 8);
    tap(state, 2, 2);
    run(state, 5);
    expect(state.mapId).toBe('cottage');
  });

  it('turns the page of an open message instead of walking', () => {
    const state = stateAt(11, 8);
    tap(state, 8, 2);
    run(state, 4);
    tap(state, 0, 9);
    expect(state.dialog).toBeNull();
    expect(state.autoWalk).toBeNull();
  });

  it('lets the keyboard take over at once', () => {
    const state = stateAt(9, 8);
    tap(state, 0, 0);
    run(state, 0.2);
    pressKey(state.input, ISLAND_KEY_BINDINGS, 'ArrowDown');
    stepGame(state, STEP, ISLAND_CONFIG);
    releaseKey(state.input, ISLAND_KEY_BINDINGS, 'ArrowDown');
    expect(state.autoWalk).toBeNull();
  });

  it('ignores taps on nothing reachable', () => {
    const state = stateAt(9, 8);
    tap(state, 40, 40);
    expect(state.autoWalk).toBeNull();
  });
});

describe('tap to open the portfolio', () => {
  it('a tapped phone on the studio shelf opens its project', () => {
    const studio = INTERIORS.studio;
    if (!studio) throw new Error('no studio');
    const state = createGameState(buildInteriorWorld(studio), ISLAND_CONFIG);
    Object.assign(state, { world: buildInteriorWorld(studio), mapId: 'studio' });
    Object.assign(state.player, {
      x: (studio.entry.x + 0.5) * TEST_TILE,
      y: (studio.entry.y + 0.5) * TEST_TILE,
    });
    const wall = studio.furniture.find((item) => item.kind === 'phone_wall');
    if (!wall) throw new Error('no phones');
    tap(state, wall.x + 3, wall.y);
    run(state, 4);
    expect(state.panel).toEqual({ id: 'projects', page: 3 });
  });
});

describe('clicking to walk switched off', () => {
  const click = (state: GameState, tileX: number, tileY: number): void => {
    tapAt(
      state,
      { x: (tileX + 0.5) * TEST_TILE, y: (tileY + 0.5) * TEST_TILE },
      ISLAND_CONFIG,
      false,
    );
  };

  it('does not walk or use things', () => {
    const state = stateAt(5, 5);
    click(state, 8, 8);
    click(state, 8, 2); // the mailbox
    run(state, 3);
    expect(tileOf(state)).toEqual([5, 5]);
    expect(state.dialog).toBeNull();
  });

  it('still turns the pages of an open message', () => {
    const state = stateAt(8, 3);
    state.player.facing = 'up';
    pressKey(state.input, ISLAND_KEY_BINDINGS, 'Space');
    run(state, 0.1);
    releaseKey(state.input, ISLAND_KEY_BINDINGS, 'Space');
    expect(state.dialog).not.toBeNull();
    const pages = state.dialog?.pages.length ?? 0;
    for (let i = 0; i < pages; i++) click(state, 1, 1);
    expect(state.dialog).toBeNull();
  });
});
