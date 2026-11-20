import { cellCount, isInBounds, toIndex, type GridSize } from '@/shared/engine/grid';
import { OBJECT_REGISTRY } from './objects';
import { isWalkableTile } from './tiles';
import type { World, WorldObject } from './world';

/** 1 where a tile can't be entered: unwalkable terrain or a blocking object's footprint. */
export function computeBlockedMask(
  size: GridSize,
  terrain: Uint8Array,
  objects: readonly WorldObject[],
): Uint8Array {
  const blocked = new Uint8Array(cellCount(size));
  for (let index = 0; index < blocked.length; index++) {
    blocked[index] = isWalkableTile(terrain[index] ?? 0) ? 0 : 1;
  }
  for (const object of objects) {
    const definition = OBJECT_REGISTRY[object.kind];
    if (!definition.blocksMovement) {
      continue;
    }
    for (let dy = 0; dy < definition.footprint.height; dy++) {
      for (let dx = 0; dx < definition.footprint.width; dx++) {
        if (isInBounds(size, object.x + dx, object.y + dy)) {
          blocked[toIndex(size, object.x + dx, object.y + dy)] = 1;
        }
      }
    }
  }
  return blocked;
}

/** Out-of-bounds tiles count as blocked so nothing can leave the map. */
export function isTileBlocked(world: World, x: number, y: number): boolean {
  if (!isInBounds(world, x, y)) {
    return true;
  }
  return world.blocked[toIndex(world, x, y)] === 1;
}
