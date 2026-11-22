// Getting about on the lake: which tile a point is on, the tiles reachable
// over water (8 ways, never clipping a corner of land), and a route turned
// into a few straight glides. Pure helpers for the ducks.
import { toIndex } from '@/shared/engine/grid';
import type { World } from '../world/world';

export interface PixelPoint {
  readonly x: number;
  readonly y: number;
}

/** Samples per tile when checking that a straight glide stays on the water. */
const LINE_SAMPLES_PER_TILE = 4;

export const centreOf = (world: World, tile: number, tileSizePx: number): PixelPoint => ({
  x: ((tile % world.width) + 0.5) * tileSizePx,
  y: (Math.floor(tile / world.width) + 0.5) * tileSizePx,
});

export function tileAt(world: World, x: number, y: number, tileSizePx: number): number {
  const tx = Math.floor(x / tileSizePx);
  const ty = Math.floor(y / tileSizePx);
  if (tx < 0 || ty < 0 || tx >= world.width || ty >= world.height) return -1;
  return toIndex(world, tx, ty);
}

/** Tiles on the water reachable from `from` (8 ways, no cutting past the shore), with parents. */
export function waterRoutes(
  world: World,
  water: ReadonlySet<number>,
  from: number,
): Map<number, number> {
  const parent = new Map<number, number>([[from, from]]);
  const queue = [from];
  for (const current of queue) {
    const x = current % world.width;
    const y = Math.floor(current / world.width);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= world.width || ny >= world.height) continue;
        const next = toIndex(world, nx, ny);
        if (parent.has(next) || !water.has(next)) continue;
        // A diagonal needs water on both sides, so the route never clips a corner of land.
        if (dx !== 0 && dy !== 0) {
          if (!water.has(toIndex(world, nx, y)) || !water.has(toIndex(world, x, ny))) continue;
        }
        parent.set(next, current);
        queue.push(next);
      }
    }
  }
  return parent;
}

/** True if a straight glide from a to b stays over swimming water. */
function staysOnWater(
  world: World,
  water: ReadonlySet<number>,
  a: PixelPoint,
  b: PixelPoint,
  tileSizePx: number,
): boolean {
  const steps = Math.ceil((Math.hypot(b.x - a.x, b.y - a.y) / tileSizePx) * LINE_SAMPLES_PER_TILE);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (!water.has(tileAt(world, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, tileSizePx))) {
      return false;
    }
  }
  return true;
}

/** The tile route as a few straight glides: skips every corner it can see past. */
function smoothPath(
  world: World,
  water: ReadonlySet<number>,
  start: PixelPoint,
  route: readonly PixelPoint[],
  tileSizePx: number,
): PixelPoint[] {
  const path: PixelPoint[] = [];
  let from = start;
  let i = 0;
  while (i < route.length) {
    let far = i;
    for (let j = route.length - 1; j > i; j--) {
      const point = route[j];
      if (point && staysOnWater(world, water, from, point, tileSizePx)) {
        far = j;
        break;
      }
    }
    const point = route[far];
    if (!point) break;
    path.push(point);
    from = point;
    i = far + 1;
  }
  return path;
}

/** A glide (smoothed) to the tile `goal`, or [] if it can't be reached. */
export function pathTo(
  world: World,
  water: ReadonlySet<number>,
  routes: ReadonlyMap<number, number>,
  start: PixelPoint,
  goal: number,
  tileSizePx: number,
): PixelPoint[] {
  if (!routes.has(goal)) return [];
  const tiles: number[] = [];
  for (let tile = goal; ;) {
    tiles.push(tile);
    const up = routes.get(tile);
    if (up === undefined || up === tile) break;
    tile = up;
  }
  tiles.reverse();
  const route = tiles.slice(1).map((tile) => centreOf(world, tile, tileSizePx));
  return smoothPath(world, water, start, route, tileSizePx);
}
