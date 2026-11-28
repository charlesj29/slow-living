// How the kid and the puppy get about: tile to tile along a found path, at
// their own pace, facing the way they go, round anybody standing in the way
// (they wait a moment for someone stepping in front, then go round). Pure.
import { toIndex, toPoint, type TilePoint } from '@/shared/engine/grid';
import { findPath } from '@/shared/engine/pathfinding';
import type { World } from '../world/world';

export type MateFacing = 'left' | 'right' | 'up' | 'down';

/** Something that walks the village: the kid or the puppy. */
export interface Mate {
  /** Map pixels: the middle of the feet. */
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  facing: MateFacing;
  /** Tiles still to walk through (indexes), nearest first. */
  route: number[];
  /** Walking pace (map pixels per second). */
  speedPx: number;
  moving: boolean;
  /** The other playmate's tile, kept clear too (null: none). */
  avoid: number | null;
  /** Seconds spent waiting for someone to step out of the way. */
  waitTime: number;
}

/** Where the playmates may walk: open, walkable ground. */
export interface Ground {
  readonly world: World;
  readonly walkable: ReadonlySet<number>;
  readonly tileSizePx: number;
  /** The tiles other people and animals stand on now (refilled every step). */
  readonly occupied: Set<number>;
}

export function tileOf(mate: Pick<Mate, 'x' | 'y'>, ground: Ground): number {
  const { world, tileSizePx } = ground;
  return toIndex(world, Math.floor(mate.x / tileSizePx), Math.floor(mate.y / tileSizePx));
}

export function centreOf(tile: number, ground: Ground): { x: number; y: number } {
  const p = toPoint(ground.world, tile);
  return { x: (p.x + 0.5) * ground.tileSizePx, y: (p.y + 0.5) * ground.tileSizePx };
}

export function tileDistance(a: number, b: number, ground: Ground): number {
  const pa = toPoint(ground.world, a);
  const pb = toPoint(ground.world, b);
  return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

/** Sets off for a tile (false if there's no way there). Already there counts as a way. */
export function routeTo(mate: Mate, goal: number, ground: Ground): boolean {
  const start = tileOf(mate, ground);
  if (start === goal) {
    mate.route = [];
    return true;
  }
  const cost = (index: number): number => {
    if (index === start || index === goal)
      return ground.walkable.has(index) || index === start ? 1 : Infinity;
    return ground.walkable.has(index) && !isTaken(mate, index, ground) ? 1 : Infinity;
  };
  const path = findPath(ground.world, start, goal, cost);
  mate.route = path ? path.slice(1) : [];
  return path !== null;
}

/** Somebody (or the other playmate) stands on this tile. */
const isTaken = (mate: Mate, tile: number, ground: Ground): boolean =>
  ground.occupied.has(tile) || tile === mate.avoid;

/** Wait this long for someone to step aside, then go round; give up on a taken goal after this. */
const REROUTE_SECONDS = 0.6;
const GIVE_UP_SECONDS = 3;

/** Faces from one point towards another (by the bigger offset). */
export function facingTowards(
  from: { x: number; y: number },
  to: { x: number; y: number },
): MateFacing {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'down' : 'up';
}

/** One fixed step along the route; true once there is no route left (arrived). */
export function stepAlong(mate: Mate, stepSeconds: number, ground: Ground): boolean {
  const next = mate.route[0];
  if (next === undefined) {
    mate.moving = false;
    return true;
  }
  // Somebody has stepped onto the next tile: wait, then go round (or, at the goal, settle short).
  if (next !== tileOf(mate, ground) && isTaken(mate, next, ground)) {
    mate.moving = false;
    mate.waitTime += stepSeconds;
    const goal = mate.route.at(-1);
    if (mate.waitTime >= GIVE_UP_SECONDS || goal === undefined) {
      mate.waitTime = 0;
      mate.route = [];
      return true;
    }
    // Once, after a short wait: try a way round them.
    const waited = mate.waitTime;
    if (waited - stepSeconds < REROUTE_SECONDS && waited >= REROUTE_SECONDS && goal !== next) {
      routeTo(mate, goal, ground);
      mate.waitTime = waited;
    }
    return false;
  }
  mate.waitTime = 0;
  const target = centreOf(next, ground);
  const dx = target.x - mate.x;
  const dy = target.y - mate.y;
  const distance = Math.hypot(dx, dy);
  const reach = mate.speedPx * stepSeconds;
  mate.moving = true;
  if (distance > 0) mate.facing = facingTowards(mate, target);
  if (distance <= reach) {
    mate.x = target.x;
    mate.y = target.y;
    mate.route.shift();
    if (mate.route.length === 0) {
      mate.moving = false;
      return true;
    }
    return false;
  }
  mate.x += (dx / distance) * reach;
  mate.y += (dy / distance) * reach;
  return false;
}

const SIDES: readonly TilePoint[] = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

/** A walkable tile right beside `tile`, the one nearest `from` (null if boxed in). */
export function besideTile(
  tile: number,
  from: { x: number; y: number },
  ground: Ground,
): number | null {
  const p = toPoint(ground.world, tile);
  let best: number | null = null;
  let bestDistance = Infinity;
  for (const side of SIDES) {
    const x = p.x + side.x;
    const y = p.y + side.y;
    if (x < 0 || y < 0 || x >= ground.world.width || y >= ground.world.height) continue;
    const index = toIndex(ground.world, x, y);
    if (!ground.walkable.has(index) || ground.occupied.has(index)) continue;
    const c = centreOf(index, ground);
    const distance = Math.hypot(c.x - from.x, c.y - from.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}
