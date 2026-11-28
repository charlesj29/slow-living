// When and where a fish leaps out of the lake: one at a random moment in each
// stretch of `fishJumpEverySeconds`, from an open-water spot (lake all round,
// so the arc stays over water), towards the left or the right. After it dives
// back in, the splash rings spread for a moment. Pure: from the time alone.
import { hashCoords } from '@/shared/engine/random';
import type { IslandConfig } from '../core/config';
import { isLakeTile } from '../core/world/tiles';
import type { World } from '../core/world/world';

type LakeSettings = IslandConfig['lakeLife'];

/** How long the splash rings spread after the fish dives back in. */
export const SPLASH_SECONDS = 0.9;
/** How far a leap carries the fish sideways (map pixels). */
export const LEAP_TRAVEL_PX = 12;
const SHORE_GAP_TILES = 2;

export interface FishJump {
  /** Where it leaps from (map pixels), and which way. */
  readonly x: number;
  readonly y: number;
  readonly toLeft: boolean;
  /** 0..1 through the leap; past 1 it has dived back in and the rings spread. */
  readonly progress: number;
}

/** Open water: lake tiles with lake for `SHORE_GAP_TILES` all round, so a leap never reaches the shore. */
export function leapSpots(world: World, tileSizePx: number): { x: number; y: number }[] {
  const lake = (x: number, y: number): boolean =>
    x >= 0 &&
    y >= 0 &&
    x < world.width &&
    y < world.height &&
    isLakeTile(world.terrain[y * world.width + x] ?? 0);
  const spots: { x: number; y: number }[] = [];
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      let open = true;
      for (let dy = -SHORE_GAP_TILES; dy <= SHORE_GAP_TILES && open; dy++) {
        for (let dx = -SHORE_GAP_TILES; dx <= SHORE_GAP_TILES && open; dx++)
          open = lake(x + dx, y + dy);
      }
      if (open) {
        spots.push({ x: (x + 0.5) * tileSizePx, y: (y + 0.5) * tileSizePx });
      }
    }
  }
  return spots;
}

export function fishJumpAt(
  seconds: number,
  spots: readonly { x: number; y: number }[],
  settings: LakeSettings,
): FishJump | null {
  if (spots.length === 0) return null;
  const every = settings.fishJumpEverySeconds;
  const total = settings.fishJumpSeconds + SPLASH_SECONDS;
  const index = Math.floor(seconds / every);
  const roll = hashCoords(index, 0, 0xf15b);
  const start = index * every + ((roll % 1000) / 1000) * Math.max(0, every - total);
  const local = seconds - start;
  if (local < 0 || local >= total) return null;
  const spot = spots[hashCoords(index, 1, 0xf15b) % spots.length];
  if (!spot) return null;
  return {
    x: spot.x,
    y: spot.y,
    toLeft: (roll & 1) === 0,
    progress: local / settings.fishJumpSeconds,
  };
}
