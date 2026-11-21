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
import type { World } from '../world/world';

export type RabbitColor = 'white' | 'brown';
export type RabbitIdle = 'sit' | 'nibble' | 'alert';

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
  /** Sprites face left; facing right mirrors them. */
  facing: 'left' | 'right';
  /** The hop in progress, or null while idling. */
  hop: Hop | null;
  /** Where the current run of hops is heading (tile), and how many hops are left. */
  goal: TilePoint | null;
  hopsLeft: number;
  /** Seconds left idling, and what it does meanwhile. */
  idleTime: number;
  idle: RabbitIdle;
}

type RabbitSettings = IslandConfig['rabbits'];

/**
 * The rabbits' meadow: open land tiles a short way outside the village
 * (between `nearVillageTiles.min` and `.max` steps from its edge).
 */
export function rabbitMeadow(world: World, settings: RabbitSettings): Set<number> {
  const meadow = new Set<number>();
  if (!world.village) return meadow;
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
      if (d + 1 >= settings.nearVillageTiles.min) meadow.add(next);
    });
  }
  return meadow;
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
    };
    startIdle(rabbit, rng, settings);
    return rabbit;
  });
}

const tileOf = (r: Rabbit, tileSizePx: number): TilePoint => ({
  x: Math.floor(r.x / tileSizePx),
  y: Math.floor(r.y / tileSizePx),
});

/** One hop towards the goal (diagonals allowed), if the next tile is open meadow. */
function hopTowardsGoal(
  rabbit: Rabbit,
  world: World,
  meadow: ReadonlySet<number>,
  tileSizePx: number,
): boolean {
  const goal = rabbit.goal;
  if (!goal || rabbit.hopsLeft <= 0) return false;
  const here = tileOf(rabbit, tileSizePx);
  const dx = Math.sign(goal.x - here.x);
  const dy = Math.sign(goal.y - here.y);
  if (dx === 0 && dy === 0) return false;
  const next = { x: here.x + dx, y: here.y + dy };
  if (next.x < 0 || next.y < 0 || next.x >= world.width || next.y >= world.height) return false;
  if (!meadow.has(toIndex(world, next.x, next.y))) return false;
  if (dx !== 0) rabbit.facing = dx > 0 ? 'right' : 'left';
  rabbit.hop = {
    fromX: rabbit.x,
    fromY: rabbit.y,
    toX: (next.x + 0.5) * tileSizePx,
    toY: (next.y + 0.5) * tileSizePx,
    t: 0,
  };
  return true;
}

/** A goal a few tiles away: random, or straight away from the player when fleeing. */
function chooseGoal(
  rabbit: Rabbit,
  rng: Rng,
  settings: RabbitSettings,
  tileSizePx: number,
  awayFrom: { x: number; y: number } | null,
): TilePoint {
  const here = tileOf(rabbit, tileSizePx);
  if (awayFrom) {
    const dx = rabbit.x - awayFrom.x;
    const dy = rabbit.y - awayFrom.y;
    const length = Math.hypot(dx, dy) || 1;
    const reach = settings.fleeHops;
    return {
      x: here.x + Math.round((dx / length) * reach),
      y: here.y + Math.round((dy / length) * reach),
    };
  }
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
    if (!hopTowardsGoal(rabbit, world, meadow, tileSizePx)) startIdle(rabbit, rng, settings);
    return;
  }
  const near =
    player !== null &&
    Math.hypot(player.x - rabbit.x, player.y - rabbit.y) < settings.fleeRadiusTiles * tileSizePx;
  rabbit.idleTime -= stepSeconds;
  if (!near && rabbit.idleTime > 0) return;
  rabbit.goal = chooseGoal(rabbit, rng, settings, tileSizePx, near ? player : null);
  rabbit.hopsLeft = near ? settings.fleeHops : rng.int(1, settings.hopRangeTiles);
  if (!hopTowardsGoal(rabbit, world, meadow, tileSizePx)) startIdle(rabbit, rng, settings);
}
