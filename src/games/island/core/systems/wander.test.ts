import { describe, expect, it } from 'vitest';
import { createRng } from '@/shared/engine/random';
import { ISLAND_CONFIG } from '../config';
import { createPlayer, hitboxAt } from '../entities/player';
import { createVillager, overlaps } from '../entities/villager';
import { areaTiles, makeTestWorld, TEST_TILE } from './testWorld';
import { startTalking, updateVillager } from './wander';

const STEP = 1 / 60;
const HOME = { left: 2, top: 2, right: 7, bottom: 5 };
/** A 10×8 meadow with a rock inside the home area. */
const world = makeTestWorld(
  Array.from({ length: 8 }, () => ',,,,,,,,,,'),
  [{ kind: 'rock', x: 4, y: 3 }],
);

function simulate(seconds: number, setup?: (v: ReturnType<typeof createVillager>) => void) {
  const villager = createVillager(0, 0, { x: 3, y: 4 }, areaTiles(HOME, 10), TEST_TILE);
  setup?.(villager);
  const player = createPlayer({ x: 9, y: 7 }, TEST_TILE);
  const rng = createRng(42);
  const visited = new Set<string>();
  let moved = 0;
  for (let i = 0; i < seconds * 60; i++) {
    const before = { x: villager.x, y: villager.y };
    updateVillager(
      villager,
      world,
      { player, villagers: [villager] },
      rng,
      STEP,
      ISLAND_CONFIG.villagers,
      ISLAND_CONFIG.player,
      TEST_TILE,
    );
    moved += Math.hypot(villager.x - before.x, villager.y - before.y);
    visited.add(
      `${String(Math.floor(villager.x / TEST_TILE))},${String(Math.floor(villager.y / TEST_TILE))}`,
    );
  }
  return { villager, player, visited, moved };
}

describe('villagers wandering', () => {
  it('walk around but never leave their home area or enter blocked tiles', () => {
    const { visited, moved } = simulate(120);
    expect(moved).toBeGreaterThan(5 * TEST_TILE);
    expect(visited.size).toBeGreaterThan(3);
    for (const tile of visited) {
      const [x = -1, y = -1] = tile.split(',').map(Number);
      expect(x >= HOME.left && x <= HOME.right && y >= HOME.top && y <= HOME.bottom, tile).toBe(
        true,
      );
      expect(tile).not.toBe('4,3'); // the rock
    }
  });

  it('never walk into the player', () => {
    const villager = createVillager(0, 0, { x: 3, y: 4 }, areaTiles(HOME, 10), TEST_TILE);
    const player = createPlayer({ x: 4, y: 4 }, TEST_TILE); // right next to it, on its way
    villager.route = [
      { x: 4, y: 4 },
      { x: 5, y: 4 },
    ];
    const rng = createRng(1);
    for (let i = 0; i < 120; i++) {
      updateVillager(
        villager,
        world,
        { player, villagers: [villager] },
        rng,
        STEP,
        ISLAND_CONFIG.villagers,
        ISLAND_CONFIG.player,
        TEST_TILE,
      );
      const size = ISLAND_CONFIG.player;
      expect(
        overlaps(hitboxAt(villager.x, villager.y, size), hitboxAt(player.x, player.y, size)),
      ).toBe(false);
    }
  });

  it('stop and face the player while talking', () => {
    const villager = createVillager(0, 0, { x: 3, y: 4 }, areaTiles(HOME, 10), TEST_TILE);
    villager.route = [{ x: 4, y: 4 }];
    const player = createPlayer({ x: 2, y: 4 }, TEST_TILE);
    player.facing = 'right';
    startTalking(villager, player);
    const x = villager.x;
    updateVillager(
      villager,
      world,
      { player, villagers: [villager] },
      createRng(1),
      STEP,
      ISLAND_CONFIG.villagers,
      ISLAND_CONFIG.player,
      TEST_TILE,
    );
    expect(villager.x).toBe(x);
    expect(villager.facing).toBe('left');
    expect(villager.moving).toBe(false);
  });

  it('walk round each other instead of getting stuck (head-on on the same row)', () => {
    const open = makeTestWorld(Array.from({ length: 8 }, () => ',,,,,,,,,,'));
    const area = { left: 1, top: 2, right: 8, bottom: 5 };
    const a = createVillager(0, 0, { x: 2, y: 3 }, areaTiles(area, 10), TEST_TILE);
    const b = createVillager(1, 1, { x: 7, y: 3 }, areaTiles(area, 10), TEST_TILE);
    a.route = [3, 4, 5, 6].map((x) => ({ x, y: 3 }));
    b.route = [6, 5, 4, 3].map((x) => ({ x, y: 3 }));
    const player = createPlayer({ x: 9, y: 7 }, TEST_TILE);
    const crowd = { player, villagers: [a, b] };
    const rng = createRng(3);
    const size = ISLAND_CONFIG.player;
    const arrived = { a: false, b: false };
    for (let i = 0; i < 20 * 60; i++) {
      for (const v of [a, b]) {
        updateVillager(v, open, crowd, rng, STEP, ISLAND_CONFIG.villagers, size, TEST_TILE);
      }
      expect(overlaps(hitboxAt(a.x, a.y, size), hitboxAt(b.x, b.y, size))).toBe(false);
      arrived.a ||= Math.floor(a.x / TEST_TILE) === 6 && Math.floor(a.y / TEST_TILE) === 3;
      arrived.b ||= Math.floor(b.x / TEST_TILE) === 3 && Math.floor(b.y / TEST_TILE) === 3;
    }
    expect(arrived).toEqual({ a: true, b: true });
  });
});
