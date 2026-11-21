import {
  CARDINAL_DIRECTIONS,
  forEachNeighbor,
  isInBounds,
  toIndex,
  type GridSize,
  type TilePoint,
} from '@/shared/engine/grid';
import { findPath } from '@/shared/engine/pathfinding';
import type { Rng } from '@/shared/engine/random';
import { OBJECT_REGISTRY, type ObjectKind } from '../../world/objects';
import { TileId } from '../../world/tiles';
import { spansOf } from '../../world/village';
import { getDoorFrontTile, NO_OBJECT, type WorldObject } from '../../world/world';
import { createStepRng, type GenerationContext, type GenerationStep } from '../context';
import { addObject, objectLayerWithout, type ObjectLayer } from '../objectLayer';
import { prefixSums, rectSum, routeToTrail } from '../siteSearch';
import { planVillage, shuffled, type VillagePlan } from '../villagePlan';

/** Path tiles already laid are cheaper, so door paths merge into one network. */
const SHARED_PATH_COST = 0.3;
/** Lamps stand at least this far apart (and from the gate). */
const LAMP_SPACING = 4;

interface Site {
  readonly x: number;
  readonly y: number;
}

/**
 * The best spot near the cottage: the village's grid must be free grass and
 * the tile round it grass or trail; closer is better, and so is clearing
 * fewer trees and rocks (the rest of the island stays as it was).
 */
function findSite(context: GenerationContext, plan: VillagePlan): Site | null {
  const { size, terrain, reserved, occupancy, config, cabin } = context;
  if (!cabin) return null;
  const freeGrass = (i: number): number =>
    terrain[i] === TileId.Grass && reserved[i] === 0 ? 1 : 0;
  const edgeOk = (i: number): number => (freeGrass(i) || terrain[i] === TileId.Path ? 1 : 0);
  const grassSums = prefixSums(size, freeGrass);
  const edgeSums = prefixSums(size, edgeOk);
  const objectSums = prefixSums(size, (i) => (occupancy[i] !== NO_OBJECT ? 1 : 0));
  const door = getDoorFrontTile(cabin);
  const radius = config.village.searchRadiusTiles;
  const ringArea = (plan.width + 2) * (plan.height + 2);
  let best: Site | null = null;
  let bestScore = Infinity;
  for (let y = door.y - radius; y <= door.y + radius; y++) {
    for (let x = door.x - radius; x <= door.x + radius; x++) {
      const right = x + plan.width - 1;
      const bottom = y + plan.height - 1;
      if (!isInBounds(size, x - 1, y - 1) || !isInBounds(size, right + 1, bottom + 1)) continue;
      if (rectSum(grassSums, size, x, y, right, bottom) !== plan.width * plan.height) continue;
      if (rectSum(edgeSums, size, x - 1, y - 1, right + 1, bottom + 1) !== ringArea) continue;
      const cleared = rectSum(objectSums, size, x - 1, y - 1, right + 1, bottom + 1);
      const distance = Math.hypot(x + plan.width / 2 - door.x, y + plan.height / 2 - door.y);
      const score = distance + cleared * config.village.clearedObjectCost;
      if (score < bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }
  }
  return best;
}

/** Steps from every existing trail tile across open grass (ignoring the village site). */
function trailDistances(
  context: GenerationContext,
  layer: ObjectLayer,
  isSite: (i: number) => boolean,
): Int32Array {
  const { size, terrain } = context;
  const distance = new Int32Array(terrain.length).fill(-1);
  const queue: number[] = [];
  terrain.forEach((id, i) => {
    if ((id === TileId.Path || id === TileId.Dock) && !isSite(i)) {
      distance[i] = 0;
      queue.push(i);
    }
  });
  for (const current of queue) {
    forEachNeighbor(size, current, CARDINAL_DIRECTIONS, (next) => {
      if ((distance[next] ?? 0) !== -1 || isSite(next)) return;
      if (terrain[next] !== TileId.Grass || layer.occupancy[next] !== NO_OBJECT) return;
      distance[next] = (distance[current] ?? 0) + 1;
      queue.push(next);
    });
  }
  return distance;
}

interface Gate {
  readonly tile: number;
  /** The tiles just inside and just outside it. */
  readonly inside: number;
  readonly outside: number;
}

/** A straight stretch of fence (inside on one side, open ground on the other) nearest a trail. */
function chooseGate(
  rng: Rng,
  size: GridSize,
  fenceTiles: readonly number[],
  insideSet: ReadonlySet<number>,
  trailDistance: Int32Array,
): Gate | null {
  const fence = new Set(fenceTiles);
  let best: Gate | null = null;
  let bestDistance = Infinity;
  for (const tile of shuffled(rng, fenceTiles)) {
    const x = tile % size.width;
    const y = Math.floor(tile / size.width);
    for (const { x: dx, y: dy } of CARDINAL_DIRECTIONS) {
      const inside = toIndex(size, x + dx, y + dy);
      const outside = toIndex(size, x - dx, y - dy);
      if (!insideSet.has(inside) || insideSet.has(outside) || fence.has(outside)) continue;
      const distance = trailDistance[outside] ?? -1;
      if (distance >= 0 && distance < bestDistance) {
        bestDistance = distance;
        best = { tile, inside, outside };
      }
    }
  }
  return best;
}

/**
 * The village: an irregular fenced patch near the cottage (its size and
 * outline vary per seed) with three houses, open grass between them and the
 * fence, a gate on the side facing the nearest trail, paths from every door
 * to the gate and on to the trail, and decorations. Runs after the forests,
 * clearing only its own patch, so the rest of the island stays as it was.
 */
export const placeVillage: GenerationStep = (context) => {
  const { cabin, config, size } = context;
  if (!cabin) return context;
  const rng = createStepRng(context, 'placeVillage');
  let plan: VillagePlan | null = null;
  let site: Site | null = null;
  for (let attempt = 0; attempt < config.village.shapeAttempts && !site; attempt++) {
    plan = planVillage(rng, config.village);
    site = plan ? findSite(context, plan) : null;
  }
  if (!plan || !site) return context;
  const origin = site;
  const local = plan;

  // The plan's local grid on the island.
  const at = (lx: number, ly: number): number => toIndex(size, origin.x + lx, origin.y + ly);
  const insideSet = new Set<number>();
  const fenceTiles: number[] = [];
  const distanceToFence = new Map<number, number>();
  for (let ly = 0; ly < local.height; ly++) {
    for (let lx = 0; lx < local.width; lx++) {
      const li = ly * local.width + lx;
      if (local.inside[li]) insideSet.add(at(lx, ly));
      if (local.fence[li]) fenceTiles.push(at(lx, ly));
      const d = local.fenceDistance[li] ?? -1;
      if (d > 0) distanceToFence.set(at(lx, ly), d);
    }
  }
  const inGrid = (i: number, margin: number): boolean => {
    const x = (i % size.width) - origin.x;
    const y = Math.floor(i / size.width) - origin.y;
    return x >= -margin && y >= -margin && x < local.width + margin && y < local.height + margin;
  };
  /** The grid plus a one-tile margin: everything the village clears and reserves. */
  const isSite = (i: number): boolean => inGrid(i, 1);
  /** Inside and fence only: the trail search may cross the margin round it. */
  const isFenced = (i: number): boolean => inGrid(i, 0);

  const layer = objectLayerWithout(context, (object) => {
    const { footprint } = OBJECT_REGISTRY[object.kind];
    for (let dy = 0; dy < footprint.height; dy++) {
      for (let dx = 0; dx < footprint.width; dx++) {
        if (isSite(toIndex(size, object.x + dx, object.y + dy))) return true;
      }
    }
    return false;
  });
  const houses = local.houses.map((h) => addObject(layer, h.kind, origin.x + h.x, origin.y + h.y));

  const gate = chooseGate(
    rng,
    size,
    fenceTiles,
    insideSet,
    trailDistances(context, layer, isFenced),
  );
  if (!gate) return context;
  for (const tile of fenceTiles) {
    if (tile !== gate.tile)
      addObject(layer, 'fence', tile % size.width, Math.floor(tile / size.width));
  }

  // Paths: every door to the gate (merging into one network), then out to the trail.
  const terrain = context.terrain.slice();
  const reserved = context.reserved.slice();
  const pathTiles = new Set<number>([gate.tile]);
  const doorFronts = houses.map((house) => {
    const front = getDoorFrontTile(house);
    return toIndex(size, front.x, front.y);
  });
  const stepCost = (i: number): number => {
    if (!insideSet.has(i) || layer.occupancy[i] !== NO_OBJECT) return Infinity;
    return pathTiles.has(i) ? SHARED_PATH_COST : 1;
  };
  for (const front of doorFronts) {
    const route = findPath(size, front, gate.inside, stepCost, SHARED_PATH_COST) ?? [];
    for (const i of route) pathTiles.add(i);
  }
  for (const i of routeToTrail(context, layer, gate.outside)) {
    pathTiles.add(i);
    reserved[i] = 1;
  }
  for (const i of pathTiles) terrain[i] = TileId.Path;

  decorate(rng, {
    size,
    layer,
    insideSet,
    distanceToFence,
    pathTiles,
    doorFronts,
    gateInside: gate.inside,
    houses,
    lampPosts: config.village.lampPosts,
  });

  for (let ly = -1; ly <= local.height; ly++) {
    for (let lx = -1; lx <= local.width; lx++) reserved[at(lx, ly)] = 1;
  }
  const tiles = [...insideSet].map((i) => ({ x: i % size.width, y: Math.floor(i / size.width) }));
  return {
    ...context,
    terrain,
    reserved,
    objects: layer.objects,
    occupancy: layer.occupancy,
    cabin: layer.objects.find((object) => object.kind === 'cabin') ?? cabin,
    village: {
      interior: spansOf(tiles),
      gate: { x: gate.tile % size.width, y: Math.floor(gate.tile / size.width) },
    },
  };
};

interface DecorContext {
  readonly size: GridSize;
  readonly layer: ObjectLayer;
  readonly insideSet: ReadonlySet<number>;
  readonly distanceToFence: ReadonlyMap<number, number>;
  readonly pathTiles: ReadonlySet<number>;
  readonly doorFronts: readonly number[];
  readonly gateInside: number;
  readonly houses: readonly WorldObject[];
  readonly lampPosts: number;
}

/**
 * Decorations, by rule: a well near the middle, pots by the doors, a barrel
 * or crate beside each house, lamps along the paths,
 * haystacks near the fence and a few stumps. Never on a path or right by the
 * fence, and each is only kept if every door can still be reached.
 */
function decorate(rng: Rng, d: DecorContext): void {
  const { size, layer } = d;
  const point = (i: number): TilePoint => ({ x: i % size.width, y: Math.floor(i / size.width) });
  const footprintTiles = (kind: ObjectKind, x: number, y: number): number[] => {
    const { footprint } = OBJECT_REGISTRY[kind];
    const tiles: number[] = [];
    for (let dy = 0; dy < footprint.height; dy++) {
      for (let dx = 0; dx < footprint.width; dx++) tiles.push(toIndex(size, x + dx, y + dy));
    }
    return tiles;
  };
  const free = (i: number): boolean =>
    d.insideSet.has(i) &&
    !d.pathTiles.has(i) &&
    layer.occupancy[i] === NO_OBJECT &&
    (d.distanceToFence.get(i) ?? 0) >= 2;
  const stillReachable = (blocked: readonly number[]): boolean => {
    const extra = new Set(blocked);
    const seen = new Set([d.gateInside]);
    const queue = [d.gateInside];
    for (const current of queue) {
      forEachNeighbor(size, current, CARDINAL_DIRECTIONS, (next) => {
        if (seen.has(next) || !d.insideSet.has(next) || extra.has(next)) return;
        if (layer.occupancy[next] !== NO_OBJECT) return;
        seen.add(next);
        queue.push(next);
      });
    }
    return d.doorFronts.every((front) => seen.has(front));
  };
  const place = (kind: ObjectKind, x: number, y: number): boolean => {
    const tiles = footprintTiles(kind, x, y);
    if (!tiles.every(free)) return false;
    if (OBJECT_REGISTRY[kind].blocksMovement && !stillReachable(tiles)) return false;
    addObject(layer, kind, x, y);
    return true;
  };
  const freeTiles = (): number[] => [...d.insideSet].filter(free);

  // The well: as near the middle of the village as there's room.
  const inside = [...d.insideSet].map(point);
  const cx = inside.reduce((sum, p) => sum + p.x, 0) / Math.max(1, inside.length);
  const cy = inside.reduce((sum, p) => sum + p.y, 0) / Math.max(1, inside.length);
  const byCentre = freeTiles()
    .map(point)
    .sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
  for (const p of byCentre) if (place('well', p.x, p.y)) break;

  // Pots either side of each door step; a barrel or crate beside each house.
  d.houses.forEach((house, n) => {
    const front = getDoorFrontTile(house);
    place('flower_pot', front.x - 1, front.y);
    place('flower_pot', front.x + 1, front.y);
    const { footprint } = OBJECT_REGISTRY[house.kind];
    const side = rng.chance(0.5) ? house.x - 1 : house.x + footprint.width;
    place(n % 2 === 0 ? 'barrel' : 'crate', side, house.y + footprint.height - 1);
  });

  // Lamps beside the paths, spread out (and not crowding the gate).
  const lamps: TilePoint[] = [point(d.gateInside)];
  const besidePath = shuffled(rng, freeTiles()).filter((i) => {
    let touches = false;
    forEachNeighbor(size, i, CARDINAL_DIRECTIONS, (n) => (touches ||= d.pathTiles.has(n)));
    return touches;
  });
  for (const i of besidePath) {
    if (lamps.length > d.lampPosts) break;
    const p = point(i);
    if (lamps.some((l) => Math.max(Math.abs(l.x - p.x), Math.abs(l.y - p.y)) < LAMP_SPACING)) {
      continue;
    }
    if (place('lamp_post', p.x, p.y)) lamps.push(p);
  }

  // Haystacks near the fence, then a few stumps anywhere free.
  let stacks = 0;
  for (const i of shuffled(rng, freeTiles())) {
    if (stacks >= 2) break;
    if (d.distanceToFence.get(i) !== 2) continue;
    const p = point(i);
    if (place('haystack', p.x, p.y)) stacks++;
  }
  let stumps = 0;
  for (const i of shuffled(rng, freeTiles())) {
    if (stumps >= 2) break;
    const p = point(i);
    if (place('stump', p.x, p.y)) stumps++;
  }
}
