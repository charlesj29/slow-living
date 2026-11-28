// Puddles after the rain: a few fixed spots on the village paths and in the
// kid's field (the same spots every shower), and how wet they are now: they
// fill while it rains and dry up slowly once it stops. Pure.
import { hashCoords } from '@/shared/engine/random';
import type { IslandConfig } from '../config';
import { TileId } from '../world/tiles';
import type { World } from '../world/world';
import type { Weather } from './weather';

type AfterRain = IslandConfig['afterRain'];

/** Up to `count` of these tiles, picked evenly by a hash (the same ones every time). */
export function pickPuddles(
  world: World,
  tiles: readonly number[],
  count: number,
  salt: number,
): number[] {
  return [...tiles]
    .map((tile) => ({
      tile,
      rank: hashCoords(tile % world.width, Math.floor(tile / world.width), salt),
    }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, count)
    .map(({ tile }) => tile);
}

/** Puddle spots on the village's paths. */
export function villagePuddles(
  world: World,
  villageTiles: readonly number[],
  settings: AfterRain,
): number[] {
  const paths = villageTiles.filter(
    (t) => world.terrain[t] === TileId.Path && world.blocked[t] === 0,
  );
  return pickPuddles(world, paths, settings.villagePuddles, 0x9dd1);
}

/** How full the puddles are (0 dry .. 1 brimming): filling with the rain, drying after it. */
export function wetness(weather: Weather, settings: AfterRain): number {
  if (weather.raining) return Math.min(1, weather.intensity);
  return Math.max(0, 1 - weather.sinceRain / settings.drySeconds);
}
