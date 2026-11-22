// Villagers wander: stand a while, pick a random free tile in the village,
// walk there along an A* route that never leaves the village, repeat. They
// walk like the player (same movement and collision) and stop to face the
// player while talking. They keep out of each other's way: routes avoid the
// tiles other villagers stand on, step onto next or head for, and a villager
// that still bumps into another plans a way round instead of waiting. Only the
// player can make them wait.
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

/** Wandering keeps to the village; an errand (the dock, home...) may use any open path. */
const canWalk = (villager: Villager, index: number): boolean =>
  villager.errand ? villager.roam.has(index) : villager.home.has(index);

/** Who else is about: the player (who may block) and the other villagers (who are avoided). */
export interface Crowd {
  /** Null while the player is indoors. */
  readonly player: Player | null;
  readonly villagers: readonly Villager[];
}

const tileIndexOf = (world: World, body: Player, tileSizePx: number): number =>
  toIndex(world, Math.floor(body.x / tileSizePx), Math.floor(body.y / tileSizePx));

/** Tiles other villagers stand on or are stepping onto right now: never walk through these. */
function occupiedTiles(
  villager: Villager,
  crowd: Crowd,
  world: World,
  tileSizePx: number,
): Set<number> {
  const occupied = new Set<number>();
  for (const other of crowd.villagers) {
    if (other === villager) continue;
    occupied.add(tileIndexOf(world, other, tileSizePx));
    const next = other.route[0];
    if (next) occupied.add(toIndex(world, next.x, next.y));
  }
  return occupied;
}

/** Where the other villagers are heading: not picked as a new destination (no two share one). */
function heldGoals(villager: Villager, crowd: Crowd, world: World): Set<number> {
  const goals = new Set<number>();
  for (const other of crowd.villagers) {
    const goal = other.route.at(-1);
    if (other !== villager && goal) goals.add(toIndex(world, goal.x, goal.y));
  }
  return goals;
}

/**
 * A route inside the home area round blocked and occupied tiles: to `goal` if
 * given (it may be occupied for a moment, someone passing through), otherwise to
 * a random free tile nobody else is heading for. Empty if there is none.
 */
function planRoute(
  villager: Villager,
  world: World,
  crowd: Crowd,
  rng: Rng,
  tileSizePx: number,
  goal?: TilePoint,
): TilePoint[] {
  const start = tileIndexOf(world, villager, tileSizePx);
  const occupied = occupiedTiles(villager, crowd, world, tileSizePx);
  const target = goal ? toIndex(world, goal.x, goal.y) : -1;
  const stepCost = (index: number): number => {
    if (!canWalk(villager, index) || world.blocked[index] !== 0) return Infinity;
    return occupied.has(index) && index !== target ? Infinity : 1;
  };
  const taken = heldGoals(villager, crowd, world);
  const candidates = goal
    ? [target]
    : Array.from({ length: TRIES_PER_PICK }, () => rng.pick(villager.homeTiles)).filter(
        (index) => !taken.has(index) && !occupied.has(index),
      );
  for (const candidate of candidates) {
    if (candidate === start || !Number.isFinite(stepCost(candidate))) continue;
    const route = findPath(world, start, candidate, stepCost);
    if (route) return route.slice(1).map((index) => toPoint(world, index));
  }
  return [];
}

/** A route to the villager's errand (empty if there's no way right now). */
export function planErrandRoute(
  villager: Villager,
  world: World,
  crowd: Crowd,
  rng: Rng,
  tileSizePx: number,
): TilePoint[] {
  return villager.errand
    ? planRoute(villager, world, crowd, rng, tileSizePx, villager.errand.goal)
    : [];
}

/** A short pause before trying again when the way is blocked by another villager. */
const REPLAN_PAUSE_SECONDS = 0.4;

function rest(villager: Villager, rng: Rng, settings: WanderSettings): void {
  villager.route = [];
  villager.stuckTime = 0;
  villager.restTime = rng.range(settings.minRestSeconds, settings.maxRestSeconds);
}

/** One axis at a time (4-way, like the player): line up on x, then walk along y. */
function stepTowards(
  villager: Villager,
  target: { x: number; y: number },
): { dx: number; dy: number; facing: Direction } {
  const offX = target.x - villager.x;
  const offY = target.y - villager.y;
  if (Math.abs(offX) > ARRIVE_PX / 2) {
    return { dx: Math.sign(offX), dy: 0, facing: offX > 0 ? 'right' : 'left' };
  }
  return { dx: 0, dy: Math.sign(offY), facing: offY > 0 ? 'down' : 'up' };
}

/**
 * Plans round the other villagers to the same goal. If there's no way yet,
 * keeps the goal and pauses briefly; only after a long while picks another.
 */
function detour(
  villager: Villager,
  world: World,
  crowd: Crowd,
  rng: Rng,
  settings: WanderSettings,
  tileSizePx: number,
): void {
  const goal = villager.route.at(-1);
  const route = goal ? planRoute(villager, world, crowd, rng, tileSizePx, goal) : [];
  if (route.length > 0) {
    villager.route = route;
    villager.stuckTime = 0;
    return;
  }
  villager.pauseTime = REPLAN_PAUSE_SECONDS;
  villager.stuckTime += REPLAN_PAUSE_SECONDS;
  if (villager.stuckTime > settings.giveUpSeconds) rest(villager, rng, settings);
}

export function updateVillager(
  villager: Villager,
  world: World,
  crowd: Crowd,
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
  if (villager.pauseTime > 0) {
    villager.pauseTime -= stepSeconds;
    return;
  }

  if (villager.route.length === 0) {
    // On an errand the routine decides what happens next (no wandering off).
    if (villager.errand) return;
    villager.restTime -= stepSeconds;
    if (villager.restTime <= 0) {
      villager.route = planRoute(villager, world, crowd, rng, tileSizePx);
      if (villager.route.length === 0) rest(villager, rng, settings);
    }
    return;
  }

  const [next] = villager.route;
  if (!next) return;
  // Someone else has since claimed the next tile: go round them.
  if (occupiedTiles(villager, crowd, world, tileSizePx).has(toIndex(world, next.x, next.y))) {
    detour(villager, world, crowd, rng, settings, tileSizePx);
    return;
  }
  const target = { x: (next.x + 0.5) * tileSizePx, y: (next.y + 0.5) * tileSizePx };
  if (Math.hypot(target.x - villager.x, target.y - villager.y) <= ARRIVE_PX) {
    villager.x = target.x;
    villager.y = target.y;
    villager.route.shift();
    if (villager.route.length === 0) {
      if (villager.errand) villager.stuckTime = 0;
      else rest(villager, rng, settings);
    }
    return;
  }

  const step = stepTowards(villager, target);
  villager.facing = step.facing;
  const speed = { ...movement, walkSpeedTilesPerSecond: settings.walkSpeedTilesPerSecond };
  movePlayer(villager, { ...step, run: false }, world, stepSeconds, speed, tileSizePx);
  if (bumpsInto(villager, crowd.villagers, movement)) {
    // Another villager: step back and plan a way round them.
    villager.x = villager.previousX;
    villager.y = villager.previousY;
    villager.moving = false;
    detour(villager, world, crowd, rng, settings, tileSizePx);
    return;
  }
  if (crowd.player && bumpsInto(villager, [crowd.player], movement)) {
    // The player is in the way: step back and wait; give up if it lasts.
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
