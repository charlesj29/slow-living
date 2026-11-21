import type { TilePoint } from '@/shared/engine/grid';
import { OBJECT_REGISTRY, type ObjectKind } from './objects';
import type { Village } from './village';

/** Marks a tile with no object in `World.occupancy`. */
export const NO_OBJECT = -1;

export interface WorldObject {
  /** Index into `World.objects`. */
  readonly id: number;
  readonly kind: ObjectKind;
  /** Top-left tile of the footprint. */
  readonly x: number;
  readonly y: number;
}

/**
 * A generated island. Plain data (typed arrays + object list) so it's cheap to
 * create, easy to test and trivially serialisable later for save games.
 * Grids are row-major with y growing downwards (screen convention).
 */
export interface World {
  /** Seed the user asked for (shown in the HUD, used in the URL). */
  readonly seed: number;
  /** Seed of the attempt that passed validation (differs from `seed` after retries). */
  readonly generationSeed: number;
  readonly width: number;
  readonly height: number;
  /** TileId per tile. */
  readonly terrain: Uint8Array;
  readonly objects: readonly WorldObject[];
  /** Object id per tile, or NO_OBJECT. */
  readonly occupancy: Int32Array;
  /** 1 where movement is blocked (water, trees, cabin). */
  readonly blocked: Uint8Array;
  /** The player's cottage (null in interiors). */
  readonly cabin: WorldObject | null;
  readonly spawn: TilePoint;
  /** The fenced village, if the world has one. */
  readonly village: Village | null;
  /** True for rooms: lit by lamps at night instead of turning blue. */
  readonly indoor?: boolean;
}

/** The walkable tile directly in front of (below) a building's door. */
export function getDoorFrontTile(building: WorldObject): TilePoint {
  const door = OBJECT_REGISTRY[building.kind].door;
  if (!door) {
    throw new Error(`Object kind "${building.kind}" has no door`);
  }
  return { x: building.x + door.x, y: building.y + door.y + 1 };
}
