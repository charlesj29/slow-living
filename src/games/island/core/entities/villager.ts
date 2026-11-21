import type { TilePoint } from '@/shared/engine/grid';
import type { TileArea } from '../world/village';
import { createPlayer, hitboxAt, type Box, type HitboxSize, type Player } from './player';

/**
 * A villager walks and animates exactly like the player (same body, same
 * movement code), plus a little state for wandering inside the village.
 */
export interface Villager extends Player {
  readonly id: number;
  /** Which outfit (sprite strip) this villager wears. */
  readonly look: number;
  /** The only area this villager ever walks in. */
  readonly home: TileArea;
  /** Tiles still to walk through (centres), nearest first. */
  route: TilePoint[];
  /** Seconds left to stand around before picking somewhere new. */
  restTime: number;
  /** Seconds spent unable to move along the route (someone in the way). */
  stuckTime: number;
  /** Seconds to wait before trying a blocked way again. */
  pauseTime: number;
  /** Talking with the player: stands still, facing them. */
  talking: boolean;
}

export function createVillager(
  id: number,
  look: number,
  spawn: TilePoint,
  home: TileArea,
  tileSizePx: number,
): Villager {
  return {
    ...createPlayer(spawn, tileSizePx),
    id,
    look,
    home,
    route: [],
    restTime: 1 + id,
    stuckTime: 0,
    pauseTime: 0,
    talking: false,
  };
}

/** True if two feet hitboxes overlap. */
export function overlaps(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** True if `body` at its current position overlaps any of `others` (bodies are feet hitboxes). */
export function bumpsInto(body: Player, others: readonly Player[], size: HitboxSize): boolean {
  const box = hitboxAt(body.x, body.y, size);
  return others.some((other) => other !== body && overlaps(box, hitboxAt(other.x, other.y, size)));
}
