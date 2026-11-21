// Wild rabbits in the meadows just outside the village. A rabbit idles
// (sitting with a twitch of the ears, nibbling, or sitting up alert), then
// hops a few tiles, one tile per hop, and idles again. If the player comes
// close it hops away. Pure: positions and timers advance by the fixed step;
// randomness comes from the game's rng.
import {
  CARDINAL_DIRECTIONS,
  forEachNeighbor,
  toIndex,
  type TilePoint,
} from '@/shared/engine/grid';
import type { Rng } from '@/shared/engine/random';
import type { IslandConfig } from '../config';
import type { Player } from '../entities/player';
import { isLandTile } from '../world/tiles';
import { villageTiles } from '../world/village';
import { OBJECT_REGISTRY } from '../world/objects';
import type { World } from '../world/world';

export type RabbitColor = 'white' | 'brown';
export type RabbitIdle = 'sit' | 'nibble' | 'alert';
export type RabbitFacing = 'left' | 'right' | 'up' | 'down';

export interface Hop {
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
  /** 0..1 through the hop. */
  t: number;
}

export interface Rabbit {
  readonly id: number;
  readonly color: RabbitColor;
  /** Map pixels: the middle of the feet. */
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  /** Which way it looks: left/right use the side view (right mirrored), up the back, down the front. */
  facing: RabbitFacing;
  /** The hop in progress, or null while idling. */
  hop: Hop | null;
  /** Where the current run of hops is heading (tile), and how many hops are left. */
  goal: TilePoint | null;
  hopsLeft: number;
  /** Seconds left idling, and what it does meanwhile. */
  idleTime: number;
  idle: RabbitIdle;
  /** Seconds to wait before trying to hop again after a hop was blocked (no fidgeting). */
  waitTime: number;
}

type RabbitSettings = IslandConfig['rabbits'];

/**
 * The rabbits' meadow: open land tiles a short way outside the village
 * (between `nearVillageTiles.min` and `.max` steps from its edge), and never
 * close to a building (the cottage, the studio, the houses).
 */
export function rabbitMeadow(world: World, settings: RabbitSettings): Set<number> {
  const meadow = new Set<number>();
  if (!world.village) return meadow;
  const nearBuildings = tilesNearBuildings(world, settings.buildingClearanceTiles);
  const village = new Set(villageTiles(world.village, world));
  const distance = new Map<number, number>();
  const queue: number[] = [];
  for (const tile of village) {
    distance.set(tile, 0);
    queue.push(tile);
  }
  for (const current of queue) {
    const d = distance.get(current) ?? 0;
    if (d >= settings.nearVillageTiles.max) continue;
    forEachNeighbor(world, current, CARDINAL_DIRECTIONS, (next) => {
      if (distance.has(next) || world.blocked[next] !== 0) return;
      if (!isLandTile(world.terrain[next] ?? 0)) return;
      distance.set(next, d + 1);
      queue.push(next);
      if (d + 1 >= settings.nearVillageTiles.min && !nearBuildings.has(next)) meadow.add(next);
    });
  }
  return meadow;
}

/** Tiles within `clearance` (diagonals count as one) of any building's footprint. */
function tilesNearBuildings(world: World, clearance: number): Set<number> {
  const near = new Set<number>();
  for (const object of world.objects) {
    const { category, footprint } = OBJECT_REGISTRY[object.kind];
    if (category !== 'building') continue;
    for (let y = object.y - clearance; y < object.y + footprint.height + clearance; y++) {
      for (let x = object.x - clearance; x < object.x + footprint.width + clearance; x++) {
        if (x >= 0 && y >= 0 && x < world.width && y < world.height) near.add(toIndex(world, x, y));
      }
    }
  }
  return near;
}

function startIdle(rabbit: Rabbit, rng: Rng, settings: RabbitSettings): void {
  rabbit.hop = null;
  rabbit.goal = null;
  rabbit.hopsLeft = 0;
  rabbit.idleTime = rng.range(settings.minIdleSeconds, settings.maxIdleSeconds);
  const roll = rng.next();
  rabbit.idle = roll < 0.5 ? 'sit' : roll < 0.8 ? 'nibble' : 'alert';
}

export function createRabbits(
  world: World,
  meadow: ReadonlySet<number>,
  rng: Rng,
  settings: RabbitSettings,
  tileSizePx: number,
): Rabbit[] {
  const spots = [...meadow];
  if (!settings.enabled || spots.length === 0) return [];
  const colors: RabbitColor[] = [
    ...Array.from({ length: settings.white }, (): RabbitColor => 'white'),
    ...Array.from({ length: settings.brown }, (): RabbitColor => 'brown'),
  ];
  return colors.map((color, id) => {
    const tile = rng.pick(spots);
    const x = ((tile % world.width) + 0.5) * tileSizePx;
    const y = (Math.floor(tile / world.width) + 0.5) * tileSizePx;
    const rabbit: Rabbit = {
      id,
      color,
      x,
      y,
      previousX: x,
      previousY: y,
      facing: rng.chance(0.5) ? 'left' : 'right',
      hop: null,
      goal: null,
      hopsLeft: 0,
      idleTime: 0,
      idle: 'sit',
      waitTime: 0,
    };
    startIdle(rabbit, rng, settings);
    return rabbit;
  });
}

const tileOf = (r: Rabbit, tileSizePx: number): TilePoint => ({
  x: Math.floor(r.x / tileSizePx),
  y: Math.floor(r.y / tileSizePx),
});

/** Close enough to the player to count as in its way (map pixels). */
const PLAYER_ROOM_PX = 14;
/** After a blocked hop, wait this long before trying again. */
const RETRY_SECONDS = 0.6;

/** An open meadow tile the player isn't standing in. */
function isFree(
  world: World,
  meadow: ReadonlySet<number>,
  player: Player | null,
  tile: TilePoint,
  tileSizePx: number,
): boolean {
  if (tile.x < 0 || tile.y < 0 || tile.x >= world.width || tile.y >= world.height) return false;
  if (!meadow.has(toIndex(world, tile.x, tile.y))) return false;
  if (!player) return true;
  const cx = (tile.x + 0.5) * tileSizePx;
  const cy = (tile.y + 0.5) * tileSizePx;
  return Math.hypot(player.x - cx, player.y - cy) > PLAYER_ROOM_PX;
}

/** Faces the way of a hop: sideways (also for diagonals), else up or down. */
function faceTowards(rabbit: Rabbit, dx: number, dy: number): void {
  if (dx !== 0) rabbit.facing = dx > 0 ? 'right' : 'left';
  else if (dy !== 0) rabbit.facing = dy > 0 ? 'down' : 'up';
}

/** One hop towards the goal (diagonals allowed), if the next tile is free. */
function hopTowardsGoal(
  rabbit: Rabbit,
  world: World,
  meadow: ReadonlySet<number>,
  player: Player | null,
  tileSizePx: number,
): boolean {
  const goal = rabbit.goal;
  if (!goal || rabbit.hopsLeft <= 0) return false;
  const here = tileOf(rabbit, tileSizePx);
  const dx = Math.sign(goal.x - here.x);
  const dy = Math.sign(goal.y - here.y);
  if (dx === 0 && dy === 0) return false;
  const next = { x: here.x + dx, y: here.y + dy };
  if (!isFree(world, meadow, player, next, tileSizePx)) return false;
  faceTowards(rabbit, dx, dy);
  rabbit.hop = {
    fromX: rabbit.x,
    fromY: rabbit.y,
    toX: (next.x + 0.5) * tileSizePx,
    toY: (next.y + 0.5) * tileSizePx,
    t: 0,
  };
  return true;
}

const NEIGHBOUR_STEPS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

/**
 * Fleeing: of the free neighbouring tiles, the one that gets furthest from the
 * player, and a goal a few hops on in that direction (null if boxed in).
 */
function fleeGoal(
  rabbit: Rabbit,
  world: World,
  meadow: ReadonlySet<number>,
  player: Player,
  settings: RabbitSettings,
  tileSizePx: number,
): TilePoint | null {
  const here = tileOf(rabbit, tileSizePx);
  let best: { dx: number; dy: number; distance: number } | null = null;
  for (const [dx, dy] of NEIGHBOUR_STEPS) {
    const next = { x: here.x + dx, y: here.y + dy };
    if (!isFree(world, meadow, player, next, tileSizePx)) continue;
    const distance = Math.hypot(
      (next.x + 0.5) * tileSizePx - player.x,
      (next.y + 0.5) * tileSizePx - player.y,
    );
    if (!best || distance > best.distance) best = { dx, dy, distance };
  }
  return best
    ? { x: here.x + best.dx * settings.fleeHops, y: here.y + best.dy * settings.fleeHops }
    : null;
}

/** A random goal a few tiles away. */
function wanderGoal(
  rabbit: Rabbit,
  rng: Rng,
  settings: RabbitSettings,
  tileSizePx: number,
): TilePoint {
  const here = tileOf(rabbit, tileSizePx);
  const r = settings.hopRangeTiles;
  return { x: here.x + rng.int(-r, r), y: here.y + rng.int(-r, r) };
}

/** One fixed step: continue the hop, or idle (and maybe set off, or flee from the player). */
export function updateRabbit(
  rabbit: Rabbit,
  world: World,
  meadow: ReadonlySet<number>,
  player: Player | null,
  rng: Rng,
  stepSeconds: number,
  settings: RabbitSettings,
  tileSizePx: number,
): void {
  rabbit.previousX = rabbit.x;
  rabbit.previousY = rabbit.y;
  const hop = rabbit.hop;
  if (hop) {
    hop.t = Math.min(1, hop.t + stepSeconds / settings.hopSeconds);
    rabbit.x = hop.fromX + (hop.toX - hop.fromX) * hop.t;
    rabbit.y = hop.fromY + (hop.toY - hop.fromY) * hop.t;
    if (hop.t < 1) return;
    rabbit.hop = null;
    rabbit.hopsLeft -= 1;
    if (!hopTowardsGoal(rabbit, world, meadow, player, tileSizePx))
      startIdle(rabbit, rng, settings);
    return;
  }
  rabbit.idleTime -= stepSeconds;
  if (rabbit.waitTime > 0) {
    rabbit.waitTime -= stepSeconds;
    return;
  }
  const near =
    player !== null &&
    Math.hypot(player.x - rabbit.x, player.y - rabbit.y) < settings.fleeRadiusTiles * tileSizePx;
  if (!near && rabbit.idleTime > 0) return;
  const goal =
    near && player
      ? fleeGoal(rabbit, world, meadow, player, settings, tileSizePx)
      : wanderGoal(rabbit, rng, settings, tileSizePx);
  rabbit.goal = goal;
  rabbit.hopsLeft = near ? settings.fleeHops : rng.int(1, settings.hopRangeTiles);
  if (goal && hopTowardsGoal(rabbit, world, meadow, player, tileSizePx)) return;
  // Blocked: keep doing what it was doing and try again in a moment (no fidgeting).
  rabbit.goal = null;
  rabbit.waitTime = RETRY_SECONDS;
  if (!near) startIdle(rabbit, rng, settings);
}

/** True if the player's feet box would overlap a rabbit (rabbits are solid). */
export function bumpsIntoRabbit(
  player: Player,
  rabbits: readonly Rabbit[],
  size: { readonly hitboxWidthPx: number; readonly hitboxHeightPx: number },
): boolean {
  return rabbits.some(
    (rabbit) =>
      Math.abs(player.x - rabbit.x) < (size.hitboxWidthPx + RABBIT_BODY.width) / 2 &&
      Math.abs(player.y - rabbit.y) < (size.hitboxHeightPx + RABBIT_BODY.height) / 2,
  );
}

/** A rabbit's solid footprint (map pixels), centred on its feet. */
const RABBIT_BODY = { width: 10, height: 6 } as const;
