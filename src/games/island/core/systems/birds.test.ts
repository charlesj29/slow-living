import { describe, expect, it } from 'vitest';
import { createRng } from '@/shared/engine/random';
import { ISLAND_CONFIG } from '../config';
import { createPlayer } from '../entities/player';
import { generateValidWorld } from '../generation/testUtils';
import { getDoorFrontTile } from '../world/world';
import { birdAreas } from './birdAreas';
import { createBirds, updateBird, type Bird } from './birds';
import { roamTiles } from './routine';

const TILE = ISLAND_CONFIG.map.tileSizePx;
const STEP = 1 / 60;
const settings = ISLAND_CONFIG.birds;
const world = generateValidWorld(46);
const roam = roamTiles(world);
const areas = birdAreas(world, roam, settings.areaRadiusTiles);
const tileOf = (b: Bird): number => Math.floor(b.y / TILE) * world.width + Math.floor(b.x / TILE);

function run(birds: Bird[], seconds: number, player: ReturnType<typeof createPlayer> | null): void {
  const rng = createRng(9);
  for (let i = 0; i < seconds / STEP; i++) {
    for (const b of birds) {
      updateBird(b, world, b.homeSet, b.home, player, rng, STEP, settings, TILE);
    }
  }
}

describe('little birds', () => {
  it('have three places: before the studio, before the cottage, round the well', () => {
    expect(areas).toHaveLength(3);
    const near = (kind: string): boolean => {
      const building = world.objects.find((o) => o.kind === kind);
      if (!building) return false;
      const front = getDoorFrontTile(building);
      return areas.some((area) => area.includes(front.y * world.width + front.x));
    };
    expect(near('studio')).toBe(true);
    expect(near('cabin')).toBe(true);
    const well = world.objects.find((o) => o.kind === 'well');
    expect(well && areas[2]?.some((t) => Math.abs((t % world.width) - well.x) <= 1)).toBe(true);
  });

  it('are scattered: a flock in each place, and each keeps to its own', () => {
    const birds = createBirds(world, areas, createRng(2), settings, TILE);
    expect(birds).toHaveLength(settings.brown + settings.blue);
    for (const b of birds) expect(b.homeSet.has(tileOf(b))).toBe(true);
    expect(new Set(birds.map((b) => b.home)).size).toBe(areas.length);
    run(birds, 60, null);
    for (const b of birds) if (!b.flight) expect(b.homeSet.has(tileOf(b))).toBe(true);
  });

  it('flutter off when the player comes close, landing further away', () => {
    const [bird] = createBirds(world, areas, createRng(3), settings, TILE);
    if (!bird) throw new Error('no bird');
    bird.idleTime = 100;
    const player = createPlayer({ x: 0, y: 0 }, TILE);
    player.x = bird.x + 8;
    player.y = bird.y;
    const before = Math.hypot(player.x - bird.x, player.y - bird.y);
    run([bird], STEP, player);
    expect(bird.flight?.kind).toBe('fly');
    run([bird], 5, player);
    expect(Math.hypot(player.x - bird.x, player.y - bird.y)).toBeGreaterThan(before * 2);
  });
});
