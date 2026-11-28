// Where light falls on the water, and when. Stars and the moon are reflected
// at night (now and then a shooting star crosses the lake); golden sparkles
// dance on the lake at sunrise and sunset. Spots are picked once per island
// (the same island, the same stars); pure.
import { hashCoords } from '@/shared/engine/random';
import type { IslandConfig } from '../core/config';
import { getTileDefinition, isLakeTile } from '../core/world/tiles';
import type { World } from '../core/world/world';

type WaterSettings = IslandConfig['waterLights'];

export interface WaterSpot {
  /** Map pixels. */
  readonly x: number;
  readonly y: number;
  /** 0..1: each spot twinkles in its own time. */
  readonly phase: number;
}

export type Twinkle = 'bright' | 'dim' | 'off';

const dayFraction = (time: number): number => time - Math.floor(time);
/** A stretch of the day; one that wraps past midnight (from > to) works too. */
export function within(time: number, [from, to]: readonly [number, number]): boolean {
  const t = dayFraction(time);
  return from <= to ? t >= from && t < to : t >= from || t < to;
}

const isWater = (world: World, i: number): boolean =>
  getTileDefinition(world.terrain[i] ?? 0).waterBody !== null;

/** Up to `count` lake (or sea) tiles, picked by a hash: the same each time. */
function pickWater(
  world: World,
  count: number,
  where: 'lake' | 'sea',
  salt: number,
  tileSizePx: number,
): WaterSpot[] {
  const tiles: number[] = [];
  world.terrain.forEach((id, i) => {
    if (isWater(world, i) && isLakeTile(id) === (where === 'lake')) tiles.push(i);
  });
  return tiles
    .map((i) => ({ i, rank: hashCoords(i % world.width, Math.floor(i / world.width), salt) }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, count)
    .map(({ i, rank }) => ({
      x: (i % world.width) * tileSizePx + 3 + (rank % 10),
      y: Math.floor(i / world.width) * tileSizePx + 3 + ((rank >>> 8) % 10),
      phase: ((rank >>> 16) % 1000) / 1000,
    }));
}

/** Where stars are reflected: on the sea, and more thickly on the lake (where people look). */
export function starSpots(world: World, settings: WaterSettings, tileSizePx: number): WaterSpot[] {
  return [
    ...pickWater(world, settings.lakeStars, 'lake', 0x1a4e, tileSizePx),
    ...pickWater(world, settings.stars, 'sea', 0x57a7, tileSizePx),
  ];
}

/** Where the low sun sparkles: on the lake (it is where people look). */
export function glintSpots(world: World, settings: WaterSettings, tileSizePx: number): WaterSpot[] {
  return pickWater(world, settings.glints, 'lake', 0x611e, tileSizePx);
}

/** The moon on the lake: by its middle, or null without a lake. */
export function moonSpot(world: World, tileSizePx: number): WaterSpot | null {
  let x = 0;
  let y = 0;
  let n = 0;
  world.terrain.forEach((id, i) => {
    if (!isLakeTile(id)) return;
    x += (i % world.width) + 0.5;
    y += Math.floor(i / world.width) + 0.5;
    n += 1;
  });
  return n > 0 ? { x: (x / n) * tileSizePx, y: (y / n) * tileSizePx, phase: 0 } : null;
}

/** A light on the water slowly brightening, dimming and blinking out, in its own time. */
export function twinkle(seconds: number, phase: number, periodSeconds: number): Twinkle {
  const wave = Math.sin(2 * Math.PI * (seconds / periodSeconds + phase));
  if (wave > 0.6) return 'bright';
  return wave > -0.5 ? 'dim' : 'off';
}

export interface ShootingStar {
  /** Which one (pick its starting spot with it). */
  readonly index: number;
  /** 0..1 along its flight. */
  readonly progress: number;
}

/**
 * The shooting star crossing the water now, if any: one at a random moment
 * in each stretch of `shootingStarEverySeconds`, so they come rarely and
 * never on a beat.
 */
export function shootingStarAt(seconds: number, settings: WaterSettings): ShootingStar | null {
  const every = settings.shootingStarEverySeconds;
  const flight = settings.shootingStarSeconds;
  const index = Math.floor(seconds / every);
  const start = index * every + ((hashCoords(index, 0, 0x5407) % 1000) / 1000) * (every - flight);
  const progress = (seconds - start) / flight;
  return progress >= 0 && progress < 1 ? { index, progress } : null;
}
