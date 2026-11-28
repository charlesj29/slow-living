import { describe, expect, it } from 'vitest';
import { createRng } from '@/shared/engine/random';
import { ISLAND_CONFIG } from '../config';
import { createPlayer } from '../entities/player';
import { generateValidWorld } from '../generation/testUtils';
import { wanderTiles } from '../world/village';
import { birdGround, createBirds, updateBird, type Bird } from './birds';

const TILE = ISLAND_CONFIG.map.tileSizePx;
const STEP = 1 / 60;
const settings = ISLAND_CONFIG.birds;
const world = generateValidWorld(46);
const groundList = birdGround(world, wanderTiles(world));
const ground = new Set(groundList);
const onGround = (b: Bird): boolean =>
  ground.has(Math.floor(b.y / TILE) * world.width + Math.floor(b.x / TILE));

function run(birds: Bird[], seconds: number, player: ReturnType<typeof createPlayer> | null): void {
  const rng = createRng(9);
  for (let i = 0; i < seconds / STEP; i++) {
    for (const b of birds)
      updateBird(b, world, ground, groundList, player, rng, STEP, settings, TILE);
  }
}

describe('village birds', () => {
  it('start on the village ground, in the configured numbers', () => {
    const birds = createBirds(world, groundList, createRng(1), settings, TILE);
    expect(birds).toHaveLength(settings.brown + settings.blue);
    for (const b of birds) expect(onGround(b)).toBe(true);
  });

  it('peck and hop about, staying on the ground they know', () => {
    const birds = createBirds(world, groundList, createRng(2), settings, TILE);
    run(birds, 60, null);
    for (const b of birds) {
      if (!b.flight) expect(onGround(b)).toBe(true);
    }
  });

  it('flutter off when the player comes close, landing further away', () => {
    const [bird] = createBirds(world, groundList, createRng(3), settings, TILE);
    if (!bird) throw new Error('no bird');
    bird.idleTime = 100;
    const player = createPlayer({ x: 0, y: 0 }, TILE);
    player.x = bird.x + 8;
    player.y = bird.y;
    const before = Math.hypot(player.x - bird.x, player.y - bird.y);
    run([bird], STEP, player);
    expect(bird.flight?.kind).toBe('fly');
    run([bird], 5, player);
    expect(Math.hypot(player.x - bird.x, player.y - bird.y)).toBeGreaterThan(before * 3);
  });
});
