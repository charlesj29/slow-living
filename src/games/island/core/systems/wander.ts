// Villagers wander: stand a while, pick a random free tile in the village,
// walk there along an A* route that never leaves the village, repeat. They
// walk like the player (same movement and collision), never through the
// player or each other, and stop to face the player while talking.
import { toIndex, toPoint, type TilePoint } from '@/shared/engine/grid';
import { findPath } from '@/shared/engine/pathfinding';
import type { Rng } from '@/shared/engine/random';
import type { Direction, Player } from '../entities/player';
import { bumpsInto, type Villager } from '../entities/villager';
import type { World } from '../world/world';
import { movePlayer, type MovementSettings } from './movement';

export interface WanderSettings {
  readonly walkSpeedTilesPerSecond: number;
  readonly minRestSeconds: number;
  readonly maxRestSeconds: number;
  /** Give up on a route after being blocked this long. */
  readonly giveUpSeconds: number;
}

/** Closer than this to a waypoint's centre counts as arrived. */
const ARRIVE_PX = 0.75;
const TRIES_PER_PICK = 8;

const inHome = (villager: Villager, x: number, y: number): boolean =>
  x >= villager.home.left &&
  x <= villager.home.right &&
  y >= villager.home.top &&
  y <= villager.home.bottom;

/** A route to a random free tile inside the villager's home area, or none. */
function pickRoute(villager: Villager, world: World, rng: Rng, tileSizePx: number): TilePoint[] {
  const start = toIndex(
    world,
    Math.floor(villager.x / tileSizePx),
    Math.floor(villager.y / tileSizePx),
  );
  const stepCost = (index: number): number => {
    const { x, y } = toPoint(world, index);
    return inHome(villager, x, y) && world.blocked[index] === 0 ? 1 : Infinity;
  };
  for (let attempt = 0; attempt < TRIES_PER_PICK; attempt++) {
    const goal = toIndex(
      world,
      rng.int(villager.home.left, villager.home.right),
      rng.int(villager.home.top, villager.home.bottom),
    );
    if (goal === start || !Number.isFinite(stepCost(goal))) continue;
    const route = findPath(world, start, goal, stepCost);
    if (route) return route.slice(1).map((index) => toPoint(world, index));
  }
  return [];
}

function rest(villager: Villager, rng: Rng, settings: WanderSettings): void {
  villager.route = [];
  villager.stuckTime = 0;
  villager.restTime = rng.range(settings.minRestSeconds, settings.maxRestSeconds);
}

/** One axis at a time (4-way, like the player): line up on x, then walk along y. */
function stepTowards(
  villager: Villager,
  target: { x: number; y: number },
): {
  dx: number;
  dy: number;
  facing: Direction;
} {
  const offX = target.x - villager.x;
  const offY = target.y - villager.y;
  if (Math.abs(offX) > ARRIVE_PX / 2) {
    return { dx: Math.sign(offX), dy: 0, facing: offX > 0 ? 'right' : 'left' };
  }
  return { dx: 0, dy: Math.sign(offY), facing: offY > 0 ? 'down' : 'up' };
}

export function updateVillager(
  villager: Villager,
  world: World,
  others: readonly Player[],
  rng: Rng,
  stepSeconds: number,
  settings: WanderSettings,
  movement: MovementSettings,
  tileSizePx: number,
): void {
  villager.previousX = villager.x;
  villager.previousY = villager.y;
  villager.moving = false;
  if (villager.talking) return;

  if (villager.route.length === 0) {
    villager.restTime -= stepSeconds;
    if (villager.restTime <= 0) {
      villager.route = pickRoute(villager, world, rng, tileSizePx);
      if (villager.route.length === 0) rest(villager, rng, settings);
    }
    return;
  }

  const [next] = villager.route;
  if (!next) return;
  const target = { x: (next.x + 0.5) * tileSizePx, y: (next.y + 0.5) * tileSizePx };
  if (Math.hypot(target.x - villager.x, target.y - villager.y) <= ARRIVE_PX) {
    villager.x = target.x;
    villager.y = target.y;
    villager.route.shift();
    if (villager.route.length === 0) rest(villager, rng, settings);
    return;
  }

  const step = stepTowards(villager, target);
  villager.facing = step.facing;
  const speed = { ...movement, walkSpeedTilesPerSecond: settings.walkSpeedTilesPerSecond };
  movePlayer(villager, { ...step, run: false }, world, stepSeconds, speed, tileSizePx);
  if (bumpsInto(villager, others, movement)) {
    // Someone's in the way: step back and wait; give up if it lasts.
    villager.x = villager.previousX;
    villager.y = villager.previousY;
    villager.moving = false;
    villager.stuckTime += stepSeconds;
    if (villager.stuckTime > settings.giveUpSeconds) rest(villager, rng, settings);
    return;
  }
  villager.stuckTime = 0;
}

const OPPOSITE: Readonly<Record<Direction, Direction>> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

/** Starts a conversation: the villager stops and turns to face the player. */
export function startTalking(villager: Villager, player: Player): void {
  villager.talking = true;
  villager.moving = false;
  villager.facing = OPPOSITE[player.facing];
}
