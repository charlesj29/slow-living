// Village animals: a few chickens and a cat that potter about the village.
// They pick a nearby open tile, walk straight to it, rest (pecking, sitting,
// napping), and pick again. They never leave the village area and never block
// anyone: you can walk right past them. Pure: the game's rng drives them.
import { toIndex, type TilePoint } from '@/shared/engine/grid';
import type { Rng } from '@/shared/engine/random';
import type { IslandConfig } from '../config';
import type { World } from '../world/world';

export type AnimalKind = 'chicken' | 'cat';

export interface Animal {
  readonly id: number;
  readonly kind: AnimalKind;
  /** Map pixels: the middle of the feet. */
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  /** Sprites face left; facing right mirrors them. */
  facing: 'left' | 'right';
  /** Where it's walking to (map pixels), or null while resting. */
  target: { x: number; y: number } | null;
  /** Seconds left resting before it wanders again. */
  restTime: number;
  /** Seconds spent resting so far (a cat dozes off after a while). */
  restedFor: number;
}

type AnimalSettings = IslandConfig['animals'];

/** Close enough to the target to stop (map pixels). */
const ARRIVE_PX = 0.75;

function speedOf(animal: Animal, settings: AnimalSettings): number {
  return animal.kind === 'cat'
    ? settings.catSpeedTilesPerSecond
    : settings.chickenSpeedTilesPerSecond;
}

/** Chickens by the houses, a cat by the plaza: spawned on open village tiles. */
export function createAnimals(
  world: World,
  home: readonly number[],
  rng: Rng,
  settings: AnimalSettings,
  tileSizePx: number,
): Animal[] {
  const open = home.filter((i) => world.blocked[i] === 0);
  if (open.length === 0) return [];
  const kinds: AnimalKind[] = [
    ...Array.from({ length: settings.chickens }, (): AnimalKind => 'chicken'),
    ...Array.from({ length: settings.cats }, (): AnimalKind => 'cat'),
  ];
  return kinds.map((kind, id) => {
    const tile = rng.pick(open);
    const x = ((tile % world.width) + 0.5) * tileSizePx;
    const y = (Math.floor(tile / world.width) + 0.5) * tileSizePx;
    return {
      id,
      kind,
      x,
      y,
      previousX: x,
      previousY: y,
      facing: rng.chance(0.5) ? 'left' : 'right',
      target: null,
      restTime: rng.range(settings.minRestSeconds, settings.maxRestSeconds),
      restedFor: 0,
    };
  });
}

/** A random open village tile within the wander radius, or null. */
function pickTarget(
  animal: Animal,
  world: World,
  home: ReadonlySet<number>,
  rng: Rng,
  settings: AnimalSettings,
  tileSizePx: number,
): TilePoint | null {
  const here = { x: Math.floor(animal.x / tileSizePx), y: Math.floor(animal.y / tileSizePx) };
  const r = settings.wanderRadiusTiles;
  for (let tries = 0; tries < 8; tries++) {
    const x = here.x + rng.int(-r, r);
    const y = here.y + rng.int(-r, r);
    if (x < 0 || y < 0 || x >= world.width || y >= world.height) continue;
    const i = toIndex(world, x, y);
    if (home.has(i) && world.blocked[i] === 0) return { x, y };
  }
  return null;
}

/** One fixed step: walk towards the target (stopping at anything solid), or rest. */
export function updateAnimal(
  animal: Animal,
  world: World,
  home: ReadonlySet<number>,
  rng: Rng,
  stepSeconds: number,
  settings: AnimalSettings,
  tileSizePx: number,
): void {
  animal.previousX = animal.x;
  animal.previousY = animal.y;
  const target = animal.target;
  if (!target) {
    animal.restTime -= stepSeconds;
    animal.restedFor += stepSeconds;
    if (animal.restTime > 0) return;
    const tile = pickTarget(animal, world, home, rng, settings, tileSizePx);
    animal.restTime = rng.range(settings.minRestSeconds, settings.maxRestSeconds);
    if (!tile) return;
    animal.target = { x: (tile.x + 0.5) * tileSizePx, y: (tile.y + 0.5) * tileSizePx };
    animal.restedFor = 0;
    return;
  }
  const dx = target.x - animal.x;
  const dy = target.y - animal.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= ARRIVE_PX) {
    animal.target = null;
    return;
  }
  const step = Math.min(distance, speedOf(animal, settings) * tileSizePx * stepSeconds);
  const nextX = animal.x + (dx / distance) * step;
  const nextY = animal.y + (dy / distance) * step;
  const tile = toIndex(world, Math.floor(nextX / tileSizePx), Math.floor(nextY / tileSizePx));
  // Solid things and the edge of the village stop it: rest here instead.
  if (world.blocked[tile] !== 0 || !home.has(tile)) {
    animal.target = null;
    return;
  }
  if (Math.abs(dx) > 0.1) animal.facing = dx > 0 ? 'right' : 'left';
  animal.x = nextX;
  animal.y = nextY;
}
