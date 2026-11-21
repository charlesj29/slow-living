import { describe, expect, it } from 'vitest';
import { floodFill, toIndex } from '@/shared/engine/grid';
import { pressKey, releaseKey } from '@/shared/engine/input';
import { STUDIO_PANELS } from '../content/studio';
import { ISLAND_CONFIG } from '../config';
import { ISLAND_KEY_BINDINGS } from '../systems/controls';
import { findInteractTarget } from '../systems/interaction';
import { makeTestWorld, TEST_TILE } from '../systems/testWorld';
import { buildInteriorWorld, INTERIORS } from '../world/interiors';
import { OBJECT_REGISTRY } from '../world/objects';
import { TileId } from '../world/tiles';
import { createGameState, stepGame } from './gameState';
import { ISLAND_MAP } from './mapTravel';

const STEP = 1 / 60;
const FADE_STEPS = Math.ceil(ISLAND_CONFIG.doors.fadeSeconds / STEP) + 2;
/** A meadow with the cottage at (1, 1): its door is at (3, 4), the step below at (3, 5). */
const island = makeTestWorld(
  Array.from({ length: 9 }, () => ',,,,,,,,,,'),
  [
    { kind: 'cabin', x: 1, y: 1 },
    { kind: 'house_stone', x: 1, y: 6 },
  ],
);
const tileOf = (px: number): number => Math.floor(px / TEST_TILE);

function hold(state: ReturnType<typeof createGameState>, code: string, steps: number): void {
  pressKey(state.input, ISLAND_KEY_BINDINGS, code);
  for (let i = 0; i < steps; i++) stepGame(state, STEP, ISLAND_CONFIG);
  releaseKey(state.input, ISLAND_KEY_BINDINGS, code);
}

describe('going in and out of buildings', () => {
  it('walks up into the cottage door, fades, and stands just inside the cottage', () => {
    const state = createGameState(island, ISLAND_CONFIG);
    Object.assign(state.player, { x: 3.5 * TEST_TILE, y: 5.5 * TEST_TILE, facing: 'up' });
    hold(state, 'ArrowUp', 2);
    expect(state.transition?.phase).toBe('out');
    for (let i = 0; i < FADE_STEPS * 2; i++) stepGame(state, STEP, ISLAND_CONFIG);
    expect(state.transition).toBeNull();
    expect(state.mapId).toBe('cottage');
    const entry = INTERIORS.cottage?.entry;
    expect([tileOf(state.player.x), tileOf(state.player.y)]).toEqual([entry?.x, entry?.y]);
    expect(state.player.facing).toBe('up');
  });

  it('steps onto the doormat and comes back out in front of the door, facing away', () => {
    const state = createGameState(island, ISLAND_CONFIG);
    Object.assign(state.player, { x: 3.5 * TEST_TILE, y: 5.5 * TEST_TILE, facing: 'up' });
    hold(state, 'ArrowUp', 2);
    for (let i = 0; i < FADE_STEPS * 2; i++) stepGame(state, STEP, ISLAND_CONFIG);
    hold(state, 'ArrowDown', 30);
    for (let i = 0; i < FADE_STEPS * 2; i++) stepGame(state, STEP, ISLAND_CONFIG);
    expect(state.mapId).toBe(ISLAND_MAP);
    expect([tileOf(state.player.x), tileOf(state.player.y)]).toEqual([3, 5]);
    expect(state.player.facing).toBe('down');
  });

  it('holds the player still during the fade', () => {
    const state = createGameState(island, ISLAND_CONFIG);
    Object.assign(state.player, { x: 3.5 * TEST_TILE, y: 5.5 * TEST_TILE, facing: 'up' });
    hold(state, 'ArrowUp', 2);
    const x = state.player.x;
    hold(state, 'ArrowLeft', 5);
    expect(state.player.x).toBe(x);
  });
});

describe('interiors', () => {
  it.each(Object.values(INTERIORS))(
    '$id: entry walkable, doormat reachable, furniture inside',
    (room) => {
      const world = buildInteriorWorld(room);
      expect(world.indoor).toBe(true);
      const entry = toIndex(world, room.entry.x, room.entry.y);
      expect(world.blocked[entry]).toBe(0);
      const reached = floodFill(world, [entry], (i) => world.blocked[i] === 0);
      const mats = [...world.terrain.keys()].filter((i) => world.terrain[i] === TileId.Doormat);
      expect(mats.length).toBeGreaterThan(0);
      for (const mat of mats) expect(reached[mat]).toBe(1);
      for (const item of room.furniture) {
        const { footprint, wallMounted } = OBJECT_REGISTRY[item.kind];
        // Wall pieces hang on the back wall; everything else stands on the floor.
        const expected = wallMounted ? TileId.Wall : TileId.Floor;
        for (let dy = 0; dy < footprint.height; dy++) {
          for (let dx = 0; dx < footprint.width; dx++) {
            expect(world.terrain[toIndex(world, item.x + dx, item.y + dy)]).toBe(expected);
          }
        }
      }
    },
  );

  it.each(Object.values(INTERIORS))(
    '$id: every piece with a message can be faced from a reachable floor tile below it',
    (room) => {
      const world = buildInteriorWorld(room);
      const entry = toIndex(world, room.entry.x, room.entry.y);
      const reached = floodFill(world, [entry], (i) => world.blocked[i] === 0);
      for (const item of room.furniture) {
        const { footprint, interaction } = OBJECT_REGISTRY[item.kind];
        if (!interaction) continue;
        const below = Array.from({ length: footprint.width }, (_, dx) =>
          toIndex(world, item.x + dx, item.y + footprint.height),
        );
        expect(
          below.some((i) => reached[i] === 1),
          item.kind,
        ).toBe(true);
      }
    },
  );

  it('the studio has every portfolio piece', () => {
    const kinds = INTERIORS.studio?.furniture.map((item) => item.kind) ?? [];
    expect(kinds).toEqual(expect.arrayContaining(Object.keys(STUDIO_PANELS)));
  });
});

describe('village house doors', () => {
  const settings = {
    ...ISLAND_CONFIG.player,
    ...ISLAND_CONFIG.interaction,
    villagerPages: () => ['Hi!'],
    signPages: () => ['A sign'],
  };

  it('say they are locked when you face the door', () => {
    const big = makeTestWorld(
      Array.from({ length: 11 }, () => ',,,,,,,,,,'),
      [{ kind: 'house_stone', x: 1, y: 6 }],
    );
    const state = createGameState(big, ISLAND_CONFIG);
    // The stone house's door is at (3, 8); stand below it facing up.
    Object.assign(state.player, { x: 3.5 * TEST_TILE, y: 9.4 * TEST_TILE, facing: 'up' });
    const target = findInteractTarget(big, state.player, [], settings, TEST_TILE);
    expect(target?.pages[0]).toMatch(/locked/i);
  });

  it('stay silent when you face a wall', () => {
    const big = makeTestWorld(
      Array.from({ length: 11 }, () => ',,,,,,,,,,'),
      [{ kind: 'house_stone', x: 1, y: 6 }],
    );
    const state = createGameState(big, ISLAND_CONFIG);
    Object.assign(state.player, { x: 1.5 * TEST_TILE, y: 9.4 * TEST_TILE, facing: 'up' });
    expect(findInteractTarget(big, state.player, [], settings, TEST_TILE)).toBeNull();
  });
});
