// Tap (or click) to walk: a tapped tile becomes a route for the player, plus
// what to do on arrival. Tapping a sign, a villager or a studio piece walks up
// to it and interacts; tapping a building with an interior walks to its door
// and steps in. Pure: the render layer turns the tap into a tile.
import { findPath, type StepCost } from '@/shared/engine/pathfinding';
import { isInBounds, toIndex, toPoint, type TilePoint } from '@/shared/engine/grid';
import type { Direction, Player } from '../entities/player';
import type { Villager } from '../entities/villager';
import { OBJECT_REGISTRY } from '../world/objects';
import { NO_OBJECT, type World, type WorldObject } from '../world/world';
import type { MovementIntent } from './controls';

/** What happens once the route is walked. */
export type Arrival = 'stop' | 'interact' | 'enter';

export interface AutoWalk {
  /** Tiles still to walk through (their centres), nearest first. */
  route: TilePoint[];
  /** Turn this way on arrival (towards the thing tapped). */
  readonly facing: Direction | null;
  readonly arrival: Arrival;
  /** Seconds left to keep stepping into a door before giving up. */
  pushSeconds: number;
  /** Seconds spent not getting any closer (someone in the way). */
  stuckSeconds: number;
  /** Where the player was at the last step, to notice being stuck. */
  lastX: number;
  lastY: number;
}

interface Goal {
  readonly tile: TilePoint;
  readonly facing: Direction | null;
}

/** Close enough to a tile centre to count as there (map pixels). */
const ARRIVE_PX = 0.75;
/** Long walks run. */
const RUN_FROM_TILES = 7;
/** How long to keep stepping into a door, and to wait when blocked. */
const DOOR_PUSH_SECONDS = 0.5;
const GIVE_UP_SECONDS = 0.8;

const NEIGHBOURS: readonly (TilePoint & { readonly facing: Direction })[] = [
  { x: 0, y: 1, facing: 'up' }, // stand below, face up
  { x: 0, y: -1, facing: 'down' },
  { x: -1, y: 0, facing: 'right' },
  { x: 1, y: 0, facing: 'left' },
];

function tileOf(player: Player, tileSizePx: number): TilePoint {
  return { x: Math.floor(player.x / tileSizePx), y: Math.floor(player.y / tileSizePx) };
}

function isOpen(world: World, x: number, y: number): boolean {
  return isInBounds(world, x, y) && world.blocked[toIndex(world, x, y)] === 0;
}

/** Open tiles next to `tiles` (outside them), each with the way to face them. */
function standingSpots(world: World, tiles: readonly TilePoint[], belowOnly: boolean): Goal[] {
  const inside = new Set(tiles.map((t) => toIndex(world, t.x, t.y)));
  return tiles.flatMap((t) =>
    NEIGHBOURS.filter((n) => !belowOnly || n.facing === 'up').flatMap((n) => {
      const x = t.x + n.x;
      const y = t.y + n.y;
      return isOpen(world, x, y) && !inside.has(toIndex(world, x, y))
        ? [{ tile: { x, y }, facing: n.facing }]
        : [];
    }),
  );
}

function footprintTiles(object: WorldObject): TilePoint[] {
  const { footprint } = OBJECT_REGISTRY[object.kind];
  return Array.from({ length: footprint.width * footprint.height }, (_, i) => ({
    x: object.x + (i % footprint.width),
    y: object.y + Math.floor(i / footprint.width),
  }));
}

/** Where to go for a tapped object, and what to do there. */
function objectGoals(world: World, object: WorldObject): { goals: Goal[]; arrival: Arrival } {
  const definition = OBJECT_REGISTRY[object.kind];
  if (definition.door) {
    const front = { x: object.x + definition.door.x, y: object.y + definition.door.y + 1 };
    const arrival: Arrival = definition.interior
      ? 'enter'
      : definition.interaction
        ? 'interact'
        : 'stop';
    return { goals: [{ tile: front, facing: 'up' }], arrival };
  }
  const talks = Boolean(definition.interaction ?? definition.signpost);
  const spots = standingSpots(world, footprintTiles(object), Boolean(definition.wallMounted));
  return { goals: spots, arrival: talks ? 'interact' : 'stop' };
}

/** The shortest walkable route from the player to any of the goals. */
function shortestRoute(
  world: World,
  from: TilePoint,
  goals: readonly Goal[],
): { route: TilePoint[]; goal: Goal } | null {
  const cost: StepCost = (index) => (world.blocked[index] === 0 ? 1 : Infinity);
  const start = toIndex(world, from.x, from.y);
  let best: { route: TilePoint[]; goal: Goal } | null = null;
  for (const goal of goals) {
    const path =
      goal.tile.x === from.x && goal.tile.y === from.y
        ? [start]
        : findPath(world, start, toIndex(world, goal.tile.x, goal.tile.y), cost);
    if (path && (!best || path.length - 1 < best.route.length)) {
      best = { route: path.slice(1).map((i) => toPoint(world, i)), goal };
    }
  }
  return best;
}

/** What stands on a tile: a villager, a solid object, or nothing. */
type Thing =
  | { readonly kind: 'villager'; readonly tile: TilePoint }
  | { readonly kind: 'object'; readonly object: WorldObject }
  | null;

function thingAt(
  world: World,
  villagers: readonly Villager[],
  tile: TilePoint,
  tileSizePx: number,
): Thing {
  if (!isInBounds(world, tile.x, tile.y)) return null;
  const villager = villagers.some((v) => {
    const at = tileOf(v, tileSizePx);
    return at.x === tile.x && at.y === tile.y;
  });
  if (villager) return { kind: 'villager', tile };
  const id = world.occupancy[toIndex(world, tile.x, tile.y)] ?? NO_OBJECT;
  const object = id === NO_OBJECT ? undefined : world.objects[id];
  return object && OBJECT_REGISTRY[object.kind].blocksMovement ? { kind: 'object', object } : null;
}

/** People and small things you can talk to or read (not buildings). */
function isSmallInteractive(thing: Thing): boolean {
  if (!thing) return false;
  if (thing.kind === 'villager') return true;
  const definition = OBJECT_REGISTRY[thing.object.kind];
  return !definition.door && Boolean(definition.interaction ?? definition.signpost);
}

/**
 * What a tap on `tile` means. Sprites rise about a tile above where they
 * stand, so a tap just above a villager, a sign or the mailbox counts for them
 * (they are drawn in front of whatever is behind).
 */
function tappedThing(
  world: World,
  villagers: readonly Villager[],
  tile: TilePoint,
  tileSizePx: number,
): Thing {
  const here = thingAt(world, villagers, tile, tileSizePx);
  if (isSmallInteractive(here)) return here;
  const below = thingAt(world, villagers, { x: tile.x, y: tile.y + 1 }, tileSizePx);
  return isSmallInteractive(below) ? below : here;
}

/** Turns a tap on `tile` into a walk, or null if there's nowhere to go. */
export function planTap(
  world: World,
  player: Player,
  villagers: readonly Villager[],
  tile: TilePoint,
  tileSizePx: number,
): AutoWalk | null {
  if (!isInBounds(world, tile.x, tile.y)) return null;
  const from = tileOf(player, tileSizePx);
  let goals: Goal[];
  let arrival: Arrival = 'stop';
  const thing = tappedThing(world, villagers, tile, tileSizePx);
  if (thing?.kind === 'villager') {
    goals = standingSpots(world, [thing.tile], false);
    arrival = 'interact';
  } else if (thing?.kind === 'object') {
    ({ goals, arrival } = objectGoals(world, thing.object));
  } else if (isOpen(world, tile.x, tile.y)) {
    goals = [{ tile, facing: null }];
  } else {
    goals = standingSpots(world, [tile], false); // water, a wall: go as close as possible
  }
  const best = shortestRoute(world, from, goals);
  if (!best) return null;
  return {
    route: best.route,
    facing: best.goal.facing,
    arrival,
    pushSeconds: DOOR_PUSH_SECONDS,
    stuckSeconds: 0,
    lastX: player.x,
    lastY: player.y,
  };
}

/** One axis at a time (4-way), lining up on x before walking along y. */
function towards(player: Player, target: TilePoint): MovementIntent {
  const offX = target.x - player.x;
  const offY = target.y - player.y;
  if (Math.abs(offX) > ARRIVE_PX / 2) {
    return { dx: Math.sign(offX), dy: 0, run: false, facing: offX > 0 ? 'right' : 'left' };
  }
  return { dx: 0, dy: Math.sign(offY), run: false, facing: offY > 0 ? 'down' : 'up' };
}

const STILL: MovementIntent = { dx: 0, dy: 0, run: false, facing: undefined };

export type WalkStep =
  /** Keep moving with this intent. */
  | { readonly kind: 'move'; readonly intent: MovementIntent }
  /** Arrived: face the thing and interact with it now. */
  | { readonly kind: 'interact' }
  /** Done (arrived, or gave up). */
  | { readonly kind: 'done' };

/**
 * Follows the walk for one fixed step: heads for the next tile centre (snapping
 * onto it when close), turns on arrival and then stops, asks to interact, or
 * keeps stepping into the door until the door takes over.
 */
export function followWalk(
  walk: AutoWalk,
  player: Player,
  stepSeconds: number,
  tileSizePx: number,
): WalkStep {
  const [next] = walk.route;
  if (next) {
    const centre = { x: (next.x + 0.5) * tileSizePx, y: (next.y + 0.5) * tileSizePx };
    if (Math.hypot(centre.x - player.x, centre.y - player.y) <= ARRIVE_PX) {
      player.x = centre.x;
      player.y = centre.y;
      walk.route.shift();
      walk.stuckSeconds = 0;
      return followWalk(walk, player, 0, tileSizePx);
    }
    // Moved less than half a pixel since the last step: something is in the way.
    const moved = Math.hypot(player.x - walk.lastX, player.y - walk.lastY);
    walk.lastX = player.x;
    walk.lastY = player.y;
    walk.stuckSeconds = moved < 0.5 && stepSeconds > 0 ? walk.stuckSeconds + stepSeconds : 0;
    if (walk.stuckSeconds > GIVE_UP_SECONDS) return { kind: 'done' };
    const intent = towards(player, centre);
    return { kind: 'move', intent: { ...intent, run: walk.route.length >= RUN_FROM_TILES } };
  }
  if (walk.facing) player.facing = walk.facing;
  if (walk.arrival === 'interact') return { kind: 'interact' };
  if (walk.arrival === 'enter' && walk.pushSeconds > 0) {
    walk.pushSeconds -= stepSeconds;
    return { kind: 'move', intent: { ...STILL, dy: -1, facing: 'up' } };
  }
  return { kind: 'done' };
}
