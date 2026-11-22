// Pure helpers for the soft moments at either end of the day: how thick the
// morning mist is at a time, where its banks lie (over the lake and the
// meadows round it), and the order the lamp posts light in at dusk.
import type { TilePoint } from '@/shared/engine/grid';
import type { IslandConfig } from '../core/config';
import { isLakeTile, isLandTile } from '../core/world/tiles';
import type { World } from '../core/world/world';
import { spreadSpots } from './ambientSpots';

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** 0..1: how thick the mist is at a time of day (rises at dawn, lifts by mid-morning). */
export function mistThickness(time: number, settings: IslandConfig['mist']): number {
  const t = time - Math.floor(time);
  if (t < settings.appears || t > settings.gone) return 0;
  if (t < settings.thickFrom) return smoothstep(settings.appears, settings.thickFrom, t);
  if (t <= settings.thickUntil) return 1;
  return 1 - smoothstep(settings.thickUntil, settings.gone, t);
}

/** Banks tend to sit at least this far apart (tiles). */
const MIST_SPACING_TILES = 5;
/** How far from the lake (tiles) a meadow bank may lie. */
const MEADOW_REACH_TILES = 6;

/**
 * Where the mist banks lie (map pixels, tile centres): half over the lake,
 * half on open land near it, spread apart. The same for the same island.
 */
export function mistSpots(world: World, count: number, tileSizePx: number): TilePoint[] {
  const lake: TilePoint[] = [];
  const meadow: TilePoint[] = [];
  const lakeTiles: TilePoint[] = [];
  world.terrain.forEach((tile, index) => {
    const at = { x: index % world.width, y: Math.floor(index / world.width) };
    if (isLakeTile(tile)) lakeTiles.push(at);
  });
  if (lakeTiles.length === 0) return [];
  const middle = {
    x: Math.round(lakeTiles.reduce((sum, t) => sum + t.x, 0) / lakeTiles.length),
    y: Math.round(lakeTiles.reduce((sum, t) => sum + t.y, 0) / lakeTiles.length),
  };
  lake.push(...lakeTiles);
  world.terrain.forEach((tile, index) => {
    const at = { x: index % world.width, y: Math.floor(index / world.width) };
    if (!isLandTile(tile) || world.blocked[index] !== 0) return;
    const near = Math.hypot(at.x - middle.x, at.y - middle.y);
    if (near <= MEADOW_REACH_TILES + Math.sqrt(lakeTiles.length) / 2) meadow.push(at);
  });
  const overLake = spreadSpots(lake, middle, Math.ceil(count / 2), MIST_SPACING_TILES);
  const onMeadow = spreadSpots(
    meadow.filter((m) =>
      overLake.every((l) => Math.hypot(m.x - l.x, m.y - l.y) >= MIST_SPACING_TILES),
    ),
    middle,
    count - overLake.length,
    MIST_SPACING_TILES,
  );
  return [...overLake, ...onMeadow].map((tile) => ({
    x: (tile.x + 0.5) * tileSizePx,
    y: (tile.y + 0.5) * tileSizePx,
  }));
}

/**
 * For each lamp (in the given order), the evening light at which it comes on:
 * the nearest to `origin` first, then outwards, spread between `first` and `last`.
 */
export function lanternThresholds(
  lamps: readonly { readonly x: number; readonly y: number }[],
  origin: { readonly x: number; readonly y: number },
  settings: IslandConfig['lanterns'],
): number[] {
  const ranked = lamps
    .map((lamp, i) => ({ i, distance: Math.hypot(lamp.x - origin.x, lamp.y - origin.y) }))
    .sort((a, b) => a.distance - b.distance || a.i - b.i);
  const thresholds = new Array<number>(lamps.length).fill(settings.first);
  const span = Math.max(1, lamps.length - 1);
  ranked.forEach(({ i }, rank) => {
    thresholds[i] = settings.first + ((settings.last - settings.first) * rank) / span;
  });
  return thresholds;
}
