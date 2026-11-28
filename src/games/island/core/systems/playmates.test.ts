import { describe, expect, it } from 'vitest';
import { createRng } from '@/shared/engine/random';
import { ISLAND_CONFIG } from '../config';
import { createPlayer, type Player } from '../entities/player';
import { generateValidWorld } from '../generation/testUtils';
import { tileOf } from './playmateMotion';
import { createPlaymates, updatePlaymates, type Playmates } from './playmates';
import { roamTiles } from './routine';

const TILE = ISLAND_CONFIG.map.tileSizePx;
const STEP = 1 / 30;
const settings = ISLAND_CONFIG.playmates;
const world = generateValidWorld(46);
const roam = roamTiles(world);
const DAY = 0.5;
const NIGHT = 0.9;

function playmates(): Playmates {
  const p = createPlaymates(world, roam, settings, TILE);
  if (!p) throw new Error('no playmates');
  return p;
}

function run(
  p: Playmates,
  seconds: number,
  time: number,
  player: Player | null = null,
  each?: () => void,
): void {
  const rng = createRng(5);
  for (let i = 0; i < seconds / STEP; i++) {
    updatePlaymates(p, player, time, rng, STEP, settings);
    each?.();
  }
}

describe('the village kid and the puppy', () => {
  it('go out to play by the well, and play fetch', () => {
    const p = playmates();
    let fetched = false;
    run(p, 180, DAY, null, () => {
      if (p.ball.holder === 'dog') fetched = true;
    });
    expect(p.kid.hidden).toBe(false);
    expect(fetched).toBe(true);
    for (const mate of [p.kid, p.dog]) expect(roam.has(tileOf(mate, p.ground))).toBe(true);
  });

  it('the puppy trots over to say hello to the player, with a heart', () => {
    const p = playmates();
    run(p, 20, DAY);
    const player = createPlayer({ x: 0, y: 0 }, TILE);
    player.x = p.dog.x + TILE * 2;
    player.y = p.dog.y;
    let hearts = false;
    run(p, 10, DAY, player, () => {
      if (p.bubble?.who === 'dog' && p.bubble.kind === 'heart') hearts = true;
    });
    expect(hearts).toBe(true);
    expect(p.greetCooldown).toBeGreaterThan(0);
  });

  it('go home at night: the kid indoors, the puppy asleep by the door', () => {
    const p = playmates();
    run(p, 30, DAY);
    run(p, 60, NIGHT);
    expect(p.kid.hidden).toBe(true);
    expect(p.dog.pose).toBe('sleep');
    expect(tileOf(p.dog, p.ground)).toBe(p.bed);
    run(p, 1, DAY);
    expect(p.kid.hidden).toBe(false);
  });
});
