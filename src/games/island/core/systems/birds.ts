// Little birds at the forest's edge, before the studio and before the cottage. A bird pecks at the ground or looks about,
// now and then hops a few pixels or flits a short way; when the player comes
// close it flutters off to land a few tiles further on, away from them. They
// live in two small flocks, each keeping to its own place (see `birdAreas`). Pure: positions and timers advance by the fixed
// step; randomness comes from the rng passed in.
import type { Rng } from '@/shared/engine/random';
import type { IslandConfig } from '../config';
import type { Player } from '../entities/player';
import { OBJECT_REGISTRY } from '../world/objects';
import type { Spot } from './bodies';
import type { World } from '../world/world';

export type BirdColor = 'brown' | 'blue';
export type BirdIdle = 'peck' | 'look' | 'huddle';

export interface Flight {
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
  /** A little hop on the ground, or a proper flight with flapping wings. */
  readonly kind: 'hop' | 'fly';
  /** How long it takes, and how high it arcs (map pixels). */
  readonly seconds: number;
  readonly height: number;
  /** 0..1 through the flight. */
  t: number;
}

export interface Bird {
  readonly id: number;
  readonly color: BirdColor;
  /** Map pixels: where its feet touch the ground. */
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  facing: 'left' | 'right';
  flight: Flight | null;
  idle: BirdIdle;
  idleTime: number;
  /** The flock's place: the ground it lands on. */
  readonly home: readonly number[];
  readonly homeSet: ReadonlySet<number>;
  /** Ground under or beside a tree in that place: shelter from the rain. */
  readonly shelters: readonly number[];
  readonly shelterSet: ReadonlySet<number>;
}

type BirdSettings = IslandConfig['birds'];

const HOP = { seconds: 0.2, height: 2, reachX: 6, reachY: 4 } as const;
/** A flight arcs higher the further it goes, up to this (map pixels). */
const MAX_FLIGHT_HEIGHT = 14;
const FLIGHT_ARC_PER_PX = 0.25;
/** Candidate landing spots tried when choosing where to fly. */
const LANDING_TRIES = 12;
/** Birds of a flock start within this many tiles of its middle. */
const FLOCK_SPREAD_TILES = 2;
const FLOCKS = 2;
/** Others startle them from this share of the player's distance. */
const WALKER_STARTLE_SHARE = 0.6;

const tileCentre = (tile: number, world: World, tileSizePx: number): [number, number] => [
  ((tile % world.width) + 0.5) * tileSizePx,
  (Math.floor(tile / world.width) + 0.5) * tileSizePx,
];

function startIdle(bird: Bird, rng: Rng, settings: BirdSettings): void {
  bird.flight = null;
  bird.idle = rng.chance(0.6) ? 'peck' : 'look';
  bird.idleTime = rng.range(settings.minIdleSeconds, settings.maxIdleSeconds);
}

/** Tiles of a place with a tree on them or right beside them. */
function underTrees(world: World, home: readonly number[]): number[] {
  const near = new Set<number>();
  for (const object of world.objects) {
    if (OBJECT_REGISTRY[object.kind].category !== 'tree') continue;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) near.add((object.y + dy) * world.width + object.x + dx);
    }
  }
  return home.filter((tile) => near.has(tile));
}

export function createBirds(
  world: World,
  areas: readonly (readonly number[])[],
  rng: Rng,
  settings: BirdSettings,
  tileSizePx: number,
): Bird[] {
  if (!settings.enabled || areas.length === 0) return [];
  const colors: BirdColor[] = [
    ...Array.from({ length: settings.brown }, (): BirdColor => 'brown'),
    ...Array.from({ length: settings.blue }, (): BirdColor => 'blue'),
  ];
  // Each flock settles in one of the places, picked at random.
  const flocks = Array.from({ length: FLOCKS }, () => {
    const home = rng.pick(areas);
    const shelters = underTrees(world, home);
    return {
      home,
      homeSet: new Set(home),
      shelters,
      shelterSet: new Set(shelters),
      middle: tileCentre(rng.pick(home), world, tileSizePx),
    };
  });
  const spread = FLOCK_SPREAD_TILES * tileSizePx;
  return colors.map((color, id) => {
    const flock = flocks[id % FLOCKS] ?? flocks[0];
    if (!flock) throw new Error('no flock');
    const [fx, fy] = flock.middle;
    const ground = flock.home;
    const near = ground.filter((tile) => {
      const [x, y] = tileCentre(tile, world, tileSizePx);
      return Math.abs(x - fx) <= spread && Math.abs(y - fy) <= spread;
    });
    const [x, y] = tileCentre(
      near.length > 0 ? rng.pick(near) : rng.pick(ground),
      world,
      tileSizePx,
    );
    const bird: Bird = {
      id,
      color,
      x,
      y,
      previousX: x,
      previousY: y,
      facing: rng.chance(0.5) ? 'left' : 'right',
      flight: null,
      idle: 'peck',
      idleTime: 0,
      home: flock.home,
      homeSet: flock.homeSet,
      shelters: flock.shelters,
      shelterSet: flock.shelterSet,
    };
    startIdle(bird, rng, settings);
    return bird;
  });
}

function isGround(
  world: World,
  ground: ReadonlySet<number>,
  x: number,
  y: number,
  tileSizePx: number,
): boolean {
  const tx = Math.floor(x / tileSizePx);
  const ty = Math.floor(y / tileSizePx);
  return tx >= 0 && ty >= 0 && tx < world.width && ground.has(ty * world.width + tx);
}

function setOff(
  bird: Bird,
  toX: number,
  toY: number,
  kind: Flight['kind'],
  settings: BirdSettings,
): void {
  const distance = Math.hypot(toX - bird.x, toY - bird.y);
  if (toX !== bird.x) bird.facing = toX > bird.x ? 'right' : 'left';
  bird.flight =
    kind === 'hop'
      ? {
          fromX: bird.x,
          fromY: bird.y,
          toX,
          toY,
          kind,
          seconds: HOP.seconds,
          height: HOP.height,
          t: 0,
        }
      : {
          fromX: bird.x,
          fromY: bird.y,
          toX,
          toY,
          kind,
          seconds: Math.max(0.4, distance / settings.flySpeedPx),
          height: Math.min(MAX_FLIGHT_HEIGHT, distance * FLIGHT_ARC_PER_PX),
          t: 0,
        };
}

/** A landing spot a few tiles off: the one furthest from the player, if one is about. */
function landingSpot(
  bird: Bird,
  world: World,
  groundList: readonly number[],
  player: Spot | null,
  rng: Rng,
  settings: BirdSettings,
  tileSizePx: number,
): [number, number] | null {
  let best: [number, number] | null = null;
  let bestScore = -Infinity;
  for (let i = 0; i < LANDING_TRIES; i++) {
    const [cx, cy] = tileCentre(rng.pick(groundList), world, tileSizePx);
    const x = cx + rng.range(-4, 4);
    const y = cy + rng.range(-4, 4);
    const tiles = Math.hypot(x - bird.x, y - bird.y) / tileSizePx;
    if (tiles < settings.flyTiles.min || tiles > settings.flyTiles.max) continue;
    const score = player ? Math.hypot(x - player.x, y - player.y) : rng.next();
    if (score > bestScore) {
      bestScore = score;
      best = [x, y];
    }
  }
  return best;
}

/** Rain: off to a spot under a tree, then fluffed up there until it clears. */
function shelterFromRain(
  bird: Bird,
  world: World,
  rng: Rng,
  settings: BirdSettings,
  tileSizePx: number,
): void {
  const tile = Math.floor(bird.y / tileSizePx) * world.width + Math.floor(bird.x / tileSizePx);
  if (bird.shelters.length > 0 && !bird.shelterSet.has(tile)) {
    const [cx, cy] = tileCentre(rng.pick(bird.shelters), world, tileSizePx);
    setOff(bird, cx + rng.range(-4, 4), cy + rng.range(-3, 3), 'fly', settings);
    return;
  }
  bird.idle = 'huddle';
  bird.idleTime = 1;
}

/** One fixed step: carry on flying, or idle (and maybe hop, flit, or flee the player). */
export function updateBird(
  bird: Bird,
  world: World,
  ground: ReadonlySet<number>,
  groundList: readonly number[],
  player: Player | null,
  rng: Rng,
  stepSeconds: number,
  settings: BirdSettings,
  tileSizePx: number,
  raining = false,
  walkers: readonly Spot[] = [],
): void {
  bird.previousX = bird.x;
  bird.previousY = bird.y;
  const flight = bird.flight;
  if (flight) {
    flight.t = Math.min(1, flight.t + stepSeconds / flight.seconds);
    bird.x = flight.fromX + (flight.toX - flight.fromX) * flight.t;
    bird.y = flight.fromY + (flight.toY - flight.fromY) * flight.t;
    if (flight.t >= 1) startIdle(bird, rng, settings);
    return;
  }
  // The player startles them from further off than a villager, the kid or the puppy.
  const close = (who: Spot, tiles: number): boolean =>
    Math.hypot(who.x - bird.x, who.y - bird.y) < tiles * tileSizePx;
  const startler =
    player && close(player, settings.fleeRadiusTiles)
      ? player
      : walkers.find((w) => close(w, settings.fleeRadiusTiles * WALKER_STARTLE_SHARE));
  if (startler) {
    const spot = landingSpot(bird, world, groundList, startler, rng, settings, tileSizePx);
    if (spot) setOff(bird, spot[0], spot[1], 'fly', settings);
    return;
  }
  if (raining) {
    shelterFromRain(bird, world, rng, settings, tileSizePx);
    return;
  }
  bird.idleTime -= stepSeconds;
  if (bird.idleTime > 0) return;
  const roll = rng.next();
  if (roll < 0.55) {
    const x = bird.x + rng.range(-HOP.reachX, HOP.reachX);
    const y = bird.y + rng.range(-HOP.reachY, HOP.reachY);
    if (isGround(world, ground, x, y, tileSizePx)) setOff(bird, x, y, 'hop', settings);
    else startIdle(bird, rng, settings);
  } else if (roll < 0.9) {
    startIdle(bird, rng, settings);
  } else {
    const spot = landingSpot(bird, world, groundList, null, rng, settings, tileSizePx);
    if (spot) setOff(bird, spot[0], spot[1], 'fly', settings);
    else startIdle(bird, rng, settings);
  }
}
