import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../config';
import { createPlayer, hitboxAt, type Player } from '../entities/player';
import type { World } from '../world/world';
import type { MovementIntent } from './controls';
import { boxHitsBlocked, movePlayer } from './movement';
import { makeTestWorld, TEST_TILE } from './testWorld';

const SETTINGS = ISLAND_CONFIG.player;
const STEP = 1 / 60;

const intent = (dx: number, dy: number, run = false): MovementIntent => ({
  dx,
  dy,
  run,
  facing: undefined,
});

/** Moves for `seconds` of simulated time in fixed steps. */
function walk(player: Player, world: World, move: MovementIntent, seconds: number): void {
  for (let t = 0; t < seconds - 1e-9; t += STEP) {
    movePlayer(player, move, world, STEP, SETTINGS, TEST_TILE);
  }
}

describe('movePlayer', () => {
  it('walks at the configured speed on grass', () => {
    const world = makeTestWorld([',,,,,,,,', ',,,,,,,,', ',,,,,,,,']);
    const player = createPlayer({ x: 1, y: 1 }, TEST_TILE);
    const startX = player.x;
    walk(player, world, intent(1, 0), 0.5);
    expect(player.x - startX).toBeCloseTo(SETTINGS.walkSpeedTilesPerSecond * TEST_TILE * 0.5, 3);
    expect(player.moving).toBe(true);
  });

  it('runs faster than it walks', () => {
    const world = makeTestWorld([',,,,,,,,,,,,', ',,,,,,,,,,,,', ',,,,,,,,,,,,']);
    const walker = createPlayer({ x: 1, y: 1 }, TEST_TILE);
    const runner = createPlayer({ x: 1, y: 1 }, TEST_TILE);
    walk(walker, world, intent(1, 0), 0.4);
    walk(runner, world, intent(1, 0, true), 0.4);
    expect(runner.x).toBeGreaterThan(walker.x);
    expect(runner.running).toBe(true);
  });

  it('moves diagonally at the same speed as straight', () => {
    const world = makeTestWorld(Array.from({ length: 8 }, () => ',,,,,,,,'));
    const player = createPlayer({ x: 2, y: 2 }, TEST_TILE);
    const start = { x: player.x, y: player.y };
    walk(player, world, intent(1, 1), 0.25);
    const distance = Math.hypot(player.x - start.x, player.y - start.y);
    expect(distance).toBeCloseTo(SETTINGS.walkSpeedTilesPerSecond * TEST_TILE * 0.25, 3);
  });

  it.each([
    ['water', ',-', []],
    ['a tree trunk', ',,', [{ kind: 'tree_small', x: 1, y: 1 }]],
    ['a rock', ',,', [{ kind: 'rock', x: 1, y: 1 }]],
    ['a fence', ',,', [{ kind: 'fence', x: 1, y: 1 }]],
    ['the cabin', ',,,,,,', [{ kind: 'cabin', x: 1, y: 0 }]],
  ] as const)('stops flush against %s', (_name, row, objects) => {
    const world = makeTestWorld([row, row, row], [...objects]);
    const player = createPlayer({ x: 0, y: 1 }, TEST_TILE);
    walk(player, world, intent(1, 0), 1);
    const box = hitboxAt(player.x, player.y, SETTINGS);
    expect(box.right).toBeCloseTo(TEST_TILE, 3);
    expect(boxHitsBlocked(world, box, TEST_TILE)).toBe(false);
  });

  it.each([
    ['grass', ',,,,'],
    ['sand', '....'],
    ['a path', '===='],
    ['a dock', '####'],
  ])('walks freely over %s', (_name, row) => {
    const world = makeTestWorld([row, row, row]);
    const player = createPlayer({ x: 0, y: 1 }, TEST_TILE);
    walk(player, world, intent(1, 0), 0.5);
    expect(player.x).toBeGreaterThan(TEST_TILE * 2);
  });

  it('walks through flowers and grass tufts', () => {
    const world = makeTestWorld(
      [',,,,', ',,,,', ',,,,'],
      [
        { kind: 'flower_red', x: 1, y: 1 },
        { kind: 'grass_tuft', x: 2, y: 1 },
      ],
    );
    const player = createPlayer({ x: 0, y: 1 }, TEST_TILE);
    walk(player, world, intent(1, 0), 1);
    expect(player.x).toBeGreaterThan(TEST_TILE * 3);
  });

  it('slides along a wall when walking diagonally into it', () => {
    const world = makeTestWorld(['------', ',,,,,,', ',,,,,,']);
    const player = createPlayer({ x: 1, y: 1 }, TEST_TILE);
    const startX = player.x;
    walk(player, world, intent(1, -1), 0.5);
    expect(player.x).toBeGreaterThan(startX + TEST_TILE);
    expect(hitboxAt(player.x, player.y, SETTINGS).top).toBeCloseTo(TEST_TILE, 3);
  });

  it('nudges around the corner of an obstacle it barely clips', () => {
    // Rock at (2,1); the player walks right a few pixels below the rock's row.
    const world = makeTestWorld([',,,,,', ',,,,,', ',,,,,'], [{ kind: 'rock', x: 2, y: 1 }]);
    const player = createPlayer({ x: 0, y: 1 }, TEST_TILE);
    const clipPx = 3;
    player.y = 2 * TEST_TILE + SETTINGS.hitboxHeightPx / 2 - clipPx;
    walk(player, world, intent(1, 0), 1);
    expect(player.x).toBeGreaterThan(3 * TEST_TILE);
  });

  it('does not nudge when the obstacle is hit squarely', () => {
    const world = makeTestWorld([',,,,,', ',,,,,', ',,,,,'], [{ kind: 'rock', x: 2, y: 1 }]);
    const player = createPlayer({ x: 0, y: 1 }, TEST_TILE);
    walk(player, world, intent(1, 0), 1);
    expect(player.x).toBeLessThan(2 * TEST_TILE);
    expect(player.moving).toBe(false);
  });

  it('never leaves the map', () => {
    const world = makeTestWorld([',,,', ',,,', ',,,']);
    const player = createPlayer({ x: 0, y: 0 }, TEST_TILE);
    walk(player, world, intent(-1, -1), 1);
    const box = hitboxAt(player.x, player.y, SETTINGS);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.top).toBeGreaterThanOrEqual(0);
  });

  it('stands still without input', () => {
    const world = makeTestWorld([',,,', ',,,', ',,,']);
    const player = createPlayer({ x: 1, y: 1 }, TEST_TILE);
    walk(player, world, intent(0, 0), 0.2);
    expect(player.moving).toBe(false);
    expect(player.x).toBe(1.5 * TEST_TILE);
  });
});
