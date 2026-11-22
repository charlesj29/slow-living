// What the island sounds like where you are: surf louder near the sea, birds
// by day, crickets at night, rain in a shower, and the crackle of a fire when
// you're in a room with one. Indoors, the outside is muffled. Pure: the UI
// samples this now and then and hands the levels to the audio.
import { distanceField, EIGHT_DIRECTIONS } from '@/shared/engine/grid';
import type { IslandConfig } from '../config';
import { getTileDefinition } from '../world/tiles';
import type { World } from '../world/world';

/** 0..1 per sound layer (the same layers as the audio's). */
export interface SoundscapeLevels {
  readonly waves: number;
  readonly birds: number;
  readonly crickets: number;
  readonly rain: number;
  readonly fire: number;
}

export interface Listener {
  /** The map you're on, and where you hear from (map pixels). */
  readonly world: World;
  readonly x: number;
  readonly y: number;
}

/** A small fireplace sounds a little quieter than the cottage's big one. */
const FIRE_LOUDNESS: Readonly<Record<string, number>> = { fireplace: 1, fireplace_small: 0.7 };
/** Across a room, a fire is still this loud. */
const FIRE_FLOOR = 0.3;
/** Fading out over this many tiles beyond `fireNearTiles`. */
const FIRE_FADE_TILES = 6;
/** Rain on the roof is louder than other outside sounds through the walls. */
const ROOF_RAIN = 2;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/** Steps (8-way) from every tile to the nearest sea tile. */
export function seaDistances(world: World): Int32Array {
  return distanceField(
    world,
    (index) => getTileDefinition(world.terrain[index] ?? 0).waterBody === 'sea',
    EIGHT_DIRECTIONS,
  );
}

function fireLevel(
  listener: Listener,
  settings: IslandConfig['ambience'],
  tileSizePx: number,
): number {
  let level = 0;
  for (const object of listener.world.objects) {
    const loudness = FIRE_LOUDNESS[object.kind];
    if (loudness === undefined) continue;
    const dx = (object.x + 1) * tileSizePx - listener.x;
    const dy = (object.y + 0.5) * tileSizePx - listener.y;
    const tiles = Math.hypot(dx, dy) / tileSizePx;
    const fade = clamp01(1 - (tiles - settings.fireNearTiles) / FIRE_FADE_TILES);
    level = Math.max(level, loudness * (FIRE_FLOOR + (1 - FIRE_FLOOR) * fade));
  }
  return level;
}

/**
 * The mix for a listener. `night` is 0 (day) .. 1 (night), `rain` the
 * shower's intensity; `seaDistance` comes from `seaDistances` of the island.
 */
export function soundscapeLevels(
  listener: Listener,
  night: number,
  rain: number,
  seaDistance: Int32Array,
  settings: IslandConfig['ambience'],
  tileSizePx: number,
): SoundscapeLevels {
  const day = 1 - night;
  const birds = day * (1 - rain);
  const crickets = night * (1 - 0.7 * rain);
  if (listener.world.indoor) {
    const damp = settings.indoorDamping;
    return {
      waves: settings.waves.floor * damp,
      birds: birds * damp,
      crickets: crickets * damp,
      rain: clamp01(rain * damp * ROOF_RAIN),
      fire: fireLevel(listener, settings, tileSizePx),
    };
  }
  const tx = Math.floor(listener.x / tileSizePx);
  const ty = Math.floor(listener.y / tileSizePx);
  const inside = tx >= 0 && ty >= 0 && tx < listener.world.width && ty < listener.world.height;
  const steps = inside ? (seaDistance[ty * listener.world.width + tx] ?? 0) : 0;
  const { nearTiles, farTiles, floor } = settings.waves;
  const near = clamp01(1 - (steps - nearTiles) / (farTiles - nearTiles));
  return {
    waves: floor + (1 - floor) * near,
    birds,
    crickets,
    rain,
    fire: 0,
  };
}
