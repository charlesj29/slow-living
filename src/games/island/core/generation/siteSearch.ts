// Helpers for finding building sites: rectangle sums over the map and a
// route from a door to the nearest existing trail. Shared by the village and
// the studio steps.
import {
  CARDINAL_DIRECTIONS,
  EIGHT_DIRECTIONS,
  forEachNeighbor,
  type GridSize,
} from '@/shared/engine/grid';
import { TileId } from '../world/tiles';
import { NO_OBJECT } from '../world/world';
import type { GenerationContext } from './context';
import type { ObjectLayer } from './objectLayer';

/** Summed-area table: any rectangle's total in O(1). */
export function prefixSums(size: GridSize, value: (index: number) => number): Int32Array {
  const w = size.width + 1;
  const sums = new Int32Array(w * (size.height + 1));
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      sums[(y + 1) * w + x + 1] =
        value(y * size.width + x) +
        (sums[y * w + x + 1] ?? 0) +
        (sums[(y + 1) * w + x] ?? 0) -
        (sums[y * w + x] ?? 0);
    }
  }
  return sums;
}

export function rectSum(
  sums: Int32Array,
  size: GridSize,
  left: number,
  top: number,
  right: number,
  bottom: number,
): number {
  const w = size.width + 1;
  return (
    (sums[(bottom + 1) * w + right + 1] ?? 0) -
    (sums[top * w + right + 1] ?? 0) -
    (sums[(bottom + 1) * w + left] ?? 0) +
    (sums[top * w + left] ?? 0)
  );
}

/** Breadth-first from `start` to the nearest existing trail: the new tiles to lay (start first). */
export function routeToTrail(
  context: GenerationContext,
  layer: ObjectLayer,
  start: number,
): number[] {
  const { size, terrain } = context;
  if (terrain[start] === TileId.Path) return [];
  // Trails keep off the tiles around rocky ledges (a path never runs along a drop).
  const nearLedge = (i: number): boolean => {
    let near = false;
    forEachNeighbor(size, i, EIGHT_DIRECTIONS, (n) => {
      near ||= terrain[n] === TileId.Cliff;
    });
    return near;
  };
  const cameFrom = new Map<number, number>([[start, -1]]);
  const queue = [start];
  for (const current of queue) {
    if (terrain[current] === TileId.Path) {
      const route: number[] = [];
      for (let step = cameFrom.get(current) ?? -1; step !== -1; step = cameFrom.get(step) ?? -1) {
        route.push(step);
      }
      return route.reverse();
    }
    forEachNeighbor(size, current, CARDINAL_DIRECTIONS, (next) => {
      if (cameFrom.has(next) || layer.occupancy[next] !== NO_OBJECT) return;
      const id = terrain[next];
      if (id !== TileId.Grass && id !== TileId.Path) return;
      if (id === TileId.Grass && nearLedge(next)) return;
      cameFrom.set(next, current);
      queue.push(next);
    });
  }
  return [];
}
