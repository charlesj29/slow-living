import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../config';
import { createGameState, stepGame } from '../game/gameState';
import { generateValidWorld } from '../generation/testUtils';
import { pressKey } from '@/shared/engine/input';
import { OBJECT_REGISTRY } from '../world/objects';
import { villageTiles } from '../world/village';
import { ISLAND_KEY_BINDINGS } from './controls';

const STEP = 1 / 60;
const TILE = ISLAND_CONFIG.map.tileSizePx;

function simulate(seconds: number): ReturnType<typeof createGameState> {
  const state = createGameState(generateValidWorld(46), ISLAND_CONFIG);
  // Keep the player far away (in the cottage) so the rabbits roam freely.
  Object.assign(state, { mapId: 'cottage' });
  for (let i = 0; i < seconds / STEP; i++) stepGame(state, STEP, ISLAND_CONFIG);
  return state;
}

describe('wild rabbits', () => {
  const state = simulate(30);

  it('are one white and one brown', () => {
    expect(state.rabbits.map((r) => r.color).sort()).toEqual(['brown', 'white']);
  });

  it('keep away from every building (cottage, studio, houses)', () => {
    const clearance = ISLAND_CONFIG.rabbits.buildingClearanceTiles;
    for (const building of state.world.objects) {
      const { category, footprint } = OBJECT_REGISTRY[building.kind];
      if (category !== 'building') continue;
      for (const tile of state.rabbitMeadow) {
        const x = tile % state.world.width;
        const y = Math.floor(tile / state.world.width);
        const inside =
          x >= building.x - clearance &&
          x < building.x + footprint.width + clearance &&
          y >= building.y - clearance &&
          y < building.y + footprint.height + clearance;
        expect(inside, `${building.kind} ${String(x)},${String(y)}`).toBe(false);
      }
    }
  });

  it('are solid: the player cannot walk through a rabbit', () => {
    const solid = createGameState(generateValidWorld(46), ISLAND_CONFIG);
    const rabbit = solid.rabbits[0];
    if (!rabbit) throw new Error('no rabbit');
    // Freeze the rabbit (a long wait) and walk straight at it from the left.
    Object.assign(rabbit, { waitTime: 99, idleTime: 99 });
    Object.assign(solid.player, { x: rabbit.x - 2 * TILE, y: rabbit.y, facing: 'right' });
    Object.assign(solid.player, { previousX: solid.player.x, previousY: solid.player.y });
    const config = { ...ISLAND_CONFIG, rabbits: { ...ISLAND_CONFIG.rabbits, fleeRadiusTiles: 0 } };
    pressKey(solid.input, ISLAND_KEY_BINDINGS, 'ArrowRight');
    for (let i = 0; i < 1 / STEP; i++) stepGame(solid, STEP, config);
    expect(solid.player.x).toBeLessThan(rabbit.x - 4);
  });

  it('live in the meadow just outside the village, never inside it or in anything solid', () => {
    const village = new Set(
      state.world.village ? villageTiles(state.world.village, state.world) : [],
    );
    expect(state.rabbitMeadow.size).toBeGreaterThan(20);
    for (const tile of state.rabbitMeadow) expect(village.has(tile)).toBe(false);
    for (const rabbit of state.rabbits) {
      const tile = Math.floor(rabbit.y / TILE) * state.world.width + Math.floor(rabbit.x / TILE);
      expect(state.rabbitMeadow.has(tile)).toBe(true);
      expect(state.world.blocked[tile]).toBe(0);
    }
  });

  it('hop about (and do the same for the same island)', () => {
    const start = createGameState(generateValidWorld(46), ISLAND_CONFIG);
    expect(
      state.rabbits.some((r, i) => r.x !== start.rabbits[i]?.x || r.y !== start.rabbits[i]?.y),
    ).toBe(true);
    const again = simulate(30);
    expect(again.rabbits.map((r) => [r.x, r.y])).toEqual(state.rabbits.map((r) => [r.x, r.y]));
  });

  it('hop away when the player comes close', () => {
    const near = createGameState(generateValidWorld(46), ISLAND_CONFIG);
    const rabbit = near.rabbits[0];
    if (!rabbit) throw new Error('no rabbit');
    Object.assign(near.player, { x: rabbit.x + TILE, y: rabbit.y });
    const before = Math.hypot(near.player.x - rabbit.x, near.player.y - rabbit.y);
    for (let i = 0; i < 1.2 / STEP; i++) stepGame(near, STEP, ISLAND_CONFIG);
    const after = Math.hypot(near.player.x - rabbit.x, near.player.y - rabbit.y);
    expect(after).toBeGreaterThan(before);
  });
});
