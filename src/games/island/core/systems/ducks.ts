// A mother duck and her ducklings on the lake. The mother pauses (bobbing, or
// dabbling: head under, tail up), then glides to another spot of open water
// along a smooth path; the ducklings follow in a line, each keeping a small
// gap to the duck ahead. If the player comes close, the family paddles away.
// At night they paddle to a quiet spot by the shore and sleep there.
// Pure: positions and timers advance by the fixed step; randomness comes from
// the game's rng.
import type { Rng } from '@/shared/engine/random';
import type { IslandConfig } from '../config';
import type { Player } from '../entities/player';
import { TileId } from '../world/tiles';
import type { World } from '../world/world';
import { centreOf, pathTo, tileAt, waterRoutes } from './waterPaths';

export type DuckKind = 'mother' | 'duckling';

export interface Duck {
  readonly id: number;
  readonly kind: DuckKind;
  /** Map pixels: the middle of the body, at the waterline. */
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  /** Ducks are drawn from the side: facing left, or mirrored to the right. */
  facing: 'left' | 'right';
  /** True while gliding (paddling faster), false while floating in place. */
  swimming: boolean;
}

export interface DuckFamily {
  /** The mother first, then her ducklings in line. */
  readonly ducks: readonly Duck[];
  /** Points (map pixels) still to glide through, nearest first. */
  path: { x: number; y: number }[];
  /** Seconds left of the current pause, and of dabbling during it. */
  idleTime: number;
  dabbleTime: number;
  /** Paddling away from the player (faster, and no dabbling). */
  shooed: boolean;
  /** Their quiet spot by the shore for the night (a water tile), and whether they sleep there now. */
  readonly roost: number;
  asleep: boolean;
}

type DuckSettings = IslandConfig['ducks'];

/** Below this many open-water tiles the shallows count as swimming water too. */
const MIN_OPEN_WATER_TILES = 8;
/** Sides to line the ducklings up on at the start, in order of preference. */
const LINE_DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/**
 * Where the ducks may swim: the lake's open water, away from the shore and a
 * tile clear of the dock (the shallows too, if the open water is tiny).
 */
export function duckWater(world: World): Set<number> {
  // A tile clear of the dock all round: a duck is wider than a tile and would paddle over the planks.
  const byDock = new Set<number>();
  world.terrain.forEach((tile, index) => {
    if (tile !== TileId.Dock) return;
    const x = index % world.width;
    const y = Math.floor(index / world.width);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) byDock.add((y + dy) * world.width + x + dx);
    }
  });
  const open = new Set<number>();
  const all = new Set<number>();
  world.terrain.forEach((tile, index) => {
    if (byDock.has(index)) return;
    if (tile === TileId.LakeWater) open.add(index);
    if (tile === TileId.LakeWater || tile === TileId.LakeShallow) all.add(index);
  });
  return open.size >= MIN_OPEN_WATER_TILES ? open : all;
}

/** How far behind the mother duck number `id` starts (map pixels): each one at its gap. */
const startOffset = (id: number, settings: DuckSettings): number =>
  id === 0 ? 0 : settings.motherGapPx + (id - 1) * settings.followGapPx;

function startPause(family: DuckFamily, rng: Rng, settings: DuckSettings): void {
  family.path = [];
  family.shooed = false;
  family.idleTime = rng.range(settings.minIdleSeconds, settings.maxIdleSeconds);
  family.dabbleTime = rng.chance(settings.dabbleChance)
    ? Math.min(settings.dabbleSeconds, family.idleTime)
    : 0;
}

export function createDuckFamily(
  world: World,
  water: ReadonlySet<number>,
  rng: Rng,
  settings: DuckSettings,
  tileSizePx: number,
): DuckFamily | null {
  const tiles = [...water];
  if (!settings.enabled || tiles.length === 0) return null;
  const start = centreOf(world, rng.pick(tiles), tileSizePx);
  const count = 1 + settings.ducklings;
  // The ducklings line up behind her, on whichever side stays on the water.
  const line =
    LINE_DIRECTIONS.find(([dx, dy]) =>
      Array.from({ length: count }, (_, id) =>
        water.has(
          tileAt(
            world,
            start.x + dx * startOffset(id, settings),
            start.y + dy * startOffset(id, settings),
            tileSizePx,
          ),
        ),
      ).every(Boolean),
    ) ?? ([0, 0] as const);
  const ducks = Array.from({ length: count }, (_, id): Duck => {
    const x = start.x + line[0] * startOffset(id, settings);
    const y = start.y + line[1] * startOffset(id, settings);
    return {
      id,
      kind: id === 0 ? 'mother' : 'duckling',
      x,
      y,
      previousX: x,
      previousY: y,
      facing: line[0] < 0 ? 'right' : 'left',
      swimming: false,
    };
  });
  const family: DuckFamily = {
    ducks,
    path: [],
    idleTime: 0,
    dabbleTime: 0,
    shooed: false,
    roost: roostTile(world, water, tileAt(world, start.x, start.y, tileSizePx)),
    asleep: false,
  };
  startPause(family, rng, settings);
  return family;
}

/** A water tile at the edge of the swimming water (by the shore), the nearest to `from`. */
function roostTile(world: World, water: ReadonlySet<number>, from: number): number {
  const fx = from % world.width;
  const fy = Math.floor(from / world.width);
  let best = from;
  let bestDistance = Infinity;
  for (const tile of water) {
    const x = tile % world.width;
    const y = Math.floor(tile / world.width);
    const edge = [tile - 1, tile + 1, tile - world.width, tile + world.width].some(
      (n) => !water.has(n),
    );
    const d = Math.hypot(x - fx, y - fy);
    if (edge && d < bestDistance) {
      bestDistance = d;
      best = tile;
    }
  }
  return best;
}

/** Night: off to the roost, then asleep there (true while that is what the family does). */
function goToRoost(
  family: DuckFamily,
  mother: Duck,
  world: World,
  water: ReadonlySet<number>,
  tileSizePx: number,
): boolean {
  if (family.path.length > 0 || family.shooed) return false;
  const here = tileAt(world, mother.x, mother.y, tileSizePx);
  if (here === family.roost) {
    family.asleep = true;
    mother.swimming = false;
    return true;
  }
  if (!water.has(here)) return false;
  family.path = pathTo(
    world,
    water,
    waterRoutes(world, water, here),
    mother,
    family.roost,
    tileSizePx,
  );
  family.dabbleTime = 0;
  return false;
}

/** Sets off somewhere: away from the player if shooed, else to a random nearby spot. */
function setOff(
  family: DuckFamily,
  world: World,
  water: ReadonlySet<number>,
  player: Player | null,
  rng: Rng,
  settings: DuckSettings,
  tileSizePx: number,
): boolean {
  const mother = family.ducks[0];
  if (!mother) return false;
  const here = tileAt(world, mother.x, mother.y, tileSizePx);
  if (!water.has(here)) return false;
  const routes = waterRoutes(world, water, here);
  const range = settings.roamRangeTiles * tileSizePx;
  const inRange = [...routes.keys()].filter((tile) => {
    const c = centreOf(world, tile, tileSizePx);
    return tile !== here && Math.hypot(c.x - mother.x, c.y - mother.y) <= range;
  });
  if (inRange.length === 0) return false;
  let goal: number | undefined;
  if (player) {
    // The spot in range furthest from the player.
    let best = -1;
    for (const tile of inRange) {
      const c = centreOf(world, tile, tileSizePx);
      const distance = Math.hypot(c.x - player.x, c.y - player.y);
      if (distance > best) {
        best = distance;
        goal = tile;
      }
    }
  } else {
    goal = rng.pick(inRange);
  }
  if (goal === undefined) return false;
  family.path = pathTo(world, water, routes, mother, goal, tileSizePx);
  family.shooed = player !== null;
  family.dabbleTime = 0;
  return family.path.length > 0;
}

/** Moves a duck by (dx, dy) and turns it the way it goes (sideways moves only). */
function glide(duck: Duck, dx: number, dy: number): void {
  duck.x += dx;
  duck.y += dy;
  if (Math.abs(dx) > 0.01) duck.facing = dx > 0 ? 'right' : 'left';
}

function stepMother(
  family: DuckFamily,
  mother: Duck,
  world: World,
  water: ReadonlySet<number>,
  player: Player | null,
  rng: Rng,
  stepSeconds: number,
  settings: DuckSettings,
  tileSizePx: number,
  night: boolean,
): void {
  const near =
    player !== null &&
    Math.hypot(player.x - mother.x, player.y - mother.y) < settings.shyRadiusTiles * tileSizePx;
  if (near && !family.shooed) {
    family.asleep = false;
    setOff(family, world, water, player, rng, settings, tileSizePx);
  }
  if (!night) family.asleep = false;
  else if (goToRoost(family, mother, world, water, tileSizePx)) return;
  const target = family.path[0];
  if (!target) {
    mother.swimming = false;
    family.idleTime -= stepSeconds;
    family.dabbleTime = Math.max(0, family.dabbleTime - stepSeconds);
    if (family.idleTime <= 0 && !setOff(family, world, water, null, rng, settings, tileSizePx)) {
      startPause(family, rng, settings);
    }
    return;
  }
  const speed = settings.swimSpeedPx * (family.shooed ? settings.shooedSpeedFactor : 1);
  const dx = target.x - mother.x;
  const dy = target.y - mother.y;
  const distance = Math.hypot(dx, dy);
  const step = speed * stepSeconds;
  mother.swimming = true;
  if (distance <= step) {
    glide(mother, dx, dy);
    family.path.shift();
    if (family.path.length === 0) startPause(family, rng, settings);
  } else {
    glide(mother, (dx / distance) * step, (dy / distance) * step);
  }
}

/** A duckling closes in on the duck ahead, easing off as it reaches its gap. */
function stepDuckling(
  duckling: Duck,
  ahead: Duck,
  stepSeconds: number,
  settings: DuckSettings,
): void {
  const dx = ahead.x - duckling.x;
  const dy = ahead.y - duckling.y;
  const distance = Math.hypot(dx, dy);
  const gap = distance - (ahead.kind === 'mother' ? settings.motherGapPx : settings.followGapPx);
  if (gap <= 0) {
    duckling.swimming = false;
    return;
  }
  const maxStep = settings.swimSpeedPx * settings.shooedSpeedFactor * 1.2 * stepSeconds;
  const step = Math.min(gap * settings.followRate * stepSeconds, maxStep);
  duckling.swimming = step > 0.02;
  glide(duckling, (dx / distance) * step, (dy / distance) * step);
}

/** One fixed step for the whole family. */
export function updateDuckFamily(
  family: DuckFamily,
  world: World,
  water: ReadonlySet<number>,
  player: Player | null,
  rng: Rng,
  stepSeconds: number,
  settings: DuckSettings,
  tileSizePx: number,
  night = false,
): void {
  for (const duck of family.ducks) {
    duck.previousX = duck.x;
    duck.previousY = duck.y;
  }
  const [mother, ...ducklings] = family.ducks;
  if (!mother) return;
  stepMother(family, mother, world, water, player, rng, stepSeconds, settings, tileSizePx, night);
  let ahead = mother;
  for (const duckling of ducklings) {
    stepDuckling(duckling, ahead, stepSeconds, settings);
    ahead = duckling;
  }
}

/** True while the mother has her head under the water (for the drawing). */
export function isDabbling(family: DuckFamily): boolean {
  return family.path.length === 0 && family.dabbleTime > 0;
}
