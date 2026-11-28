// Who stands where, so nobody walks through anybody: the player, the
// villagers, the rabbits, the kid and the puppy each take up the tile under
// their feet. Walkers plan round those tiles and wait (then go round) when
// someone steps into their way; the player bumps into them. Pure.
import { toIndex } from '@/shared/engine/grid';
import { hitboxAt, type HitboxSize, type Player } from '../entities/player';
import { overlaps } from '../entities/villager';
import type { World } from '../world/world';

/** Somebody's feet, in map pixels. */
export interface Spot {
  readonly x: number;
  readonly y: number;
}

/** A small animal's (or the kid's) solid footprint round its feet (map pixels). */
export const SMALL_BODY = { width: 10, height: 6 } as const;

export function tileUnder(spot: Spot, world: World, tileSizePx: number): number {
  return toIndex(world, Math.floor(spot.x / tileSizePx), Math.floor(spot.y / tileSizePx));
}

/** The tiles these spots stand on. */
export function tilesUnder(spots: readonly Spot[], world: World, tileSizePx: number): Set<number> {
  return new Set(spots.map((spot) => tileUnder(spot, world, tileSizePx)));
}

/** True if a character's feet box would overlap any of these small bodies. */
export function bumpsIntoSmall(body: Player, spots: readonly Spot[], size: HitboxSize): boolean {
  const box = hitboxAt(body.x, body.y, size);
  return spots.some((spot) =>
    overlaps(box, {
      left: spot.x - SMALL_BODY.width / 2,
      right: spot.x + SMALL_BODY.width / 2,
      top: spot.y - SMALL_BODY.height / 2,
      bottom: spot.y + SMALL_BODY.height / 2,
    }),
  );
}
