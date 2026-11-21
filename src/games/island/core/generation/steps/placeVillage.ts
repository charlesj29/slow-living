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
import { FLOWER_KINDS, OBJECT_REGISTRY, type ObjectKind } from '../../world/objects';
import { TileId } from '../../world/tiles';
import { spansOf } from '../../world/village';
import { getDoorFrontTile, NO_OBJECT, type WorldObject } from '../../world/world';
import { createStepRng, type GenerationContext, type GenerationStep } from '../context';
import { addObject, objectLayerWithout, type ObjectLayer } from '../objectLayer';
import { prefixSums, rectSum, routeToTrail } from '../siteSearch';
import { planVillage, shuffled, type VillagePlan } from '../villagePlan';

/** Path tiles already laid are cheaper, so door paths merge into one network. */
const SHARED_PATH_COST = 0.3;
/** Lamps stand at least this far apart. */
const LAMP_SPACING = 4;
/**
 * Plazas to try, best first: a 3×3 square (odd, so it has a middle) with a free
 * ring round it for the stall and benches, then without the ring, then a
 * single paved tile.
 */
const PLAZA_CHOICES = [
  { size: 3, ring: 2 },
  { size: 3, ring: 1 },
  { size: 3, ring: 0 },
  { size: 1, ring: 0 },
] as const;

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

/** Each house's lot: its roof rows, the house, a tile either side, its garden rows in front. */
function lotTiles(size: GridSize, house: WorldObject): number[] {
  const { footprint } = OBJECT_REGISTRY[house.kind];
  const tiles: number[] = [];
  for (let y = house.y - 2; y <= house.y + footprint.height + 1; y++) {
    for (let x = house.x - 1; x <= house.x + footprint.width; x++) tiles.push(toIndex(size, x, y));
  }
  return tiles;
}

/** The plaza's middle: the open spot nearest the middle of the doors, with room all round. */
function choosePlaza(
  size: GridSize,
  inside: ReadonlySet<number>,
  edgeDistance: ReadonlyMap<number, number>,
  taken: ReadonlySet<number>,
  doorFronts: readonly TilePoint[],
  plazaSize: number,
  ring: number,
): TilePoint | null {
  const cx = doorFronts.reduce((sum, d) => sum + d.x, 0) / Math.max(1, doorFronts.length);
  const cy = doorFronts.reduce((sum, d) => sum + d.y, 0) / Math.max(1, doorFronts.length);
  const half = Math.floor(plazaSize / 2);
  let best: TilePoint | null = null;
  let bestDistance = Infinity;
  for (const i of inside) {
    const x = i % size.width;
    const y = Math.floor(i / size.width);
    let fits = true;
    const reach = half + ring;
    for (let dy = -reach; dy <= reach && fits; dy++) {
      for (let dx = -reach; dx <= reach && fits; dx++) {
        const t = toIndex(size, x + dx, y + dy);
        const paved = Math.abs(dx) <= half && Math.abs(dy) <= half;
        // The paving needs open ground; the ring round it only has to be free of lots.
        fits = paved
          ? inside.has(t) && !taken.has(t) && (edgeDistance.get(t) ?? 0) >= 1
          : !taken.has(t);
      }
    }
    const distance = Math.hypot(x - cx, y - cy);
    if (fits && distance < bestDistance) {
      bestDistance = distance;
      best = { x, y };
    }
  }
  return best;
}

/**
 * The village: an open cluster of houses near the cottage (its size and shape
 * vary per seed) around a small plaza with a well, benches, a market stall and
 * string lights. Each house has a little front garden with a picket fence;
 * paths run from every door to the plaza and from the plaza out to the
 * nearest trail. No fence round the village: its area is recorded, so the
 * villagers and animals stay at home. Runs after the forests, clearing only
 * its own patch.
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
  const point = (i: number): TilePoint => ({ x: i % size.width, y: Math.floor(i / size.width) });
  const inside = new Set<number>();
  const edgeDistance = new Map<number, number>();
  for (let ly = 0; ly < local.height; ly++) {
    for (let lx = 0; lx < local.width; lx++) {
      const li = ly * local.width + lx;
      if (local.inside[li]) inside.add(at(lx, ly));
      const d = local.fenceDistance[li] ?? -1;
      if (d > 0) edgeDistance.set(at(lx, ly), d);
    }
  }
  const inGrid = (i: number): boolean => {
    const x = (i % size.width) - origin.x;
    const y = Math.floor(i / size.width) - origin.y;
    return x >= -1 && y >= -1 && x <= local.width && y <= local.height;
  };
  const layer = objectLayerWithout(context, (object) => {
    const { footprint } = OBJECT_REGISTRY[object.kind];
    for (let dy = 0; dy < footprint.height; dy++) {
      for (let dx = 0; dx < footprint.width; dx++) {
        if (inGrid(toIndex(size, object.x + dx, object.y + dy))) return true;
      }
    }
    return false;
  });
  const houses = local.houses.map((h) => addObject(layer, h.kind, origin.x + h.x, origin.y + h.y));
  const doorFronts = houses.map(getDoorFrontTile);
  const lots = new Set(houses.flatMap((house) => lotTiles(size, house)));
  let plaza: TilePoint | null = null;
  let plazaSize: number = PLAZA_CHOICES[0].size;
  for (const choice of PLAZA_CHOICES) {
    plaza = choosePlaza(size, inside, edgeDistance, lots, doorFronts, choice.size, choice.ring);
    plazaSize = choice.size;
    if (plaza) break;
  }
  if (!plaza) return context;
  const half = Math.floor(plazaSize / 2);
  const plazaTiles = new Set<number>();
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++)
      plazaTiles.add(toIndex(size, plaza.x + dx, plaza.y + dy));
  }
  const plazaMiddle = toIndex(size, plaza.x, plaza.y);
  const reachesDoors = (extra: ReadonlySet<number>): boolean =>
    doorsReachable(size, layer, inside, plazaMiddle, doorFronts, extra);

  // Front gardens first (the door paths go out through their gaps).
  for (const house of houses) addGarden(size, layer, inside, house, reachesDoors);

  // Paths: the plaza, every door to it (merging), and on out to the nearest trail.
  const terrain = context.terrain.slice();
  const reserved = context.reserved.slice();
  const pathTiles = new Set<number>(plazaTiles);
  const stepCost = (i: number): number => {
    if (!inside.has(i) || layer.occupancy[i] !== NO_OBJECT) return Infinity;
    return pathTiles.has(i) ? SHARED_PATH_COST : 1;
  };
  for (const front of doorFronts) {
    const start = toIndex(size, front.x, front.y);
    const route = findPath(size, start, plazaMiddle, stepCost, SHARED_PATH_COST) ?? [];
    for (const i of route) pathTiles.add(i);
  }
  const exit = routeToTrail(context, layer, plazaMiddle);
  for (const i of exit) {
    pathTiles.add(i);
    if (!inside.has(i)) reserved[i] = 1;
  }
  for (const i of pathTiles) terrain[i] = TileId.Path;
  // Where the path leaves the village: its entrance (a signpost goes beside it).
  const entrance = [...exit].reverse().find((i) => inside.has(i)) ?? plazaMiddle;

  decorate(rng, {
    size,
    layer,
    inside,
    edgeDistance,
    pathTiles,
    plaza,
    plazaHalf: half,
    houses,
    lampPosts: config.village.lampPosts,
    reachesDoors,
    lots,
  });

  for (let ly = -1; ly <= local.height; ly++) {
    for (let lx = -1; lx <= local.width; lx++) reserved[at(lx, ly)] = 1;
  }
  return {
    ...context,
    terrain,
    reserved,
    objects: layer.objects,
    occupancy: layer.occupancy,
    cabin: layer.objects.find((object) => object.kind === 'cabin') ?? cabin,
    village: { interior: spansOf([...inside].map(point)), gate: point(entrance) },
  };
};

/** Every door front can be reached from the plaza, with `extra` tiles blocked too. */
function doorsReachable(
  size: GridSize,
  layer: ObjectLayer,
  inside: ReadonlySet<number>,
  from: number,
  doorFronts: readonly TilePoint[],
  extra: ReadonlySet<number>,
): boolean {
  const seen = new Set([from]);
  const queue = [from];
  for (const current of queue) {
    forEachNeighbor(size, current, CARDINAL_DIRECTIONS, (next) => {
      if (seen.has(next) || !inside.has(next) || extra.has(next)) return;
      if (layer.occupancy[next] !== NO_OBJECT) return;
      seen.add(next);
      queue.push(next);
    });
  }
  return doorFronts.every((d) => seen.has(toIndex(size, d.x, d.y)));
}

/**
 * A little front garden like the cottage's: a picket fence along the front
 * with a gap below the door, a post either side, flowers inside. Skipped if
 * it would cut a door off.
 */
function addGarden(
  size: GridSize,
  layer: ObjectLayer,
  inside: ReadonlySet<number>,
  house: WorldObject,
  reachesDoors: (extra: ReadonlySet<number>) => boolean,
): void {
  const { footprint } = OBJECT_REGISTRY[house.kind];
  const door = getDoorFrontTile(house);
  const frontRow = house.y + footprint.height + 1;
  const fence: TilePoint[] = [];
  for (let x = house.x - 1; x <= house.x + footprint.width; x++) {
    if (x !== door.x) fence.push({ x, y: frontRow });
  }
  fence.push({ x: house.x - 1, y: door.y }, { x: house.x + footprint.width, y: door.y });
  const tiles = fence.map((p) => toIndex(size, p.x, p.y));
  const fits = tiles.every((i) => inside.has(i) && layer.occupancy[i] === NO_OBJECT);
  if (!fits || !reachesDoors(new Set(tiles))) return;
  for (const p of fence) addObject(layer, 'fence', p.x, p.y);
  // Flowers along the house front (not on the door step).
  for (let x = house.x; x < house.x + footprint.width; x++) {
    const i = toIndex(size, x, door.y);
    if (x === door.x || layer.occupancy[i] !== NO_OBJECT) continue;
    addObject(layer, FLOWER_KINDS[(x + house.y) % FLOWER_KINDS.length] ?? 'flower_red', x, door.y);
  }
}

interface DecorContext {
  readonly size: GridSize;
  readonly layer: ObjectLayer;
  readonly inside: ReadonlySet<number>;
  readonly edgeDistance: ReadonlyMap<number, number>;
  readonly pathTiles: ReadonlySet<number>;
  readonly plaza: TilePoint;
  /** Tiles from the plaza's middle to its edge (0 for a single tile). */
  readonly plazaHalf: number;
  readonly houses: readonly WorldObject[];
  readonly lampPosts: number;
  readonly reachesDoors: (extra: ReadonlySet<number>) => boolean;
  /** The houses' lots (roofs, gardens): kept clear except for things beside a house. */
  readonly lots: ReadonlySet<number>;
}

/**
 * Life round the plaza and the houses, by rule: the well in the plaza, string
 * lights across it, a market stall and benches facing it, a barrel or crate
 * by each house, lamps along the paths, a haystack and a few stumps near the
 * edge. Each solid thing is only kept if every door can still be reached.
 */
function decorate(rng: Rng, d: DecorContext): void {
  const { size, layer, plaza } = d;
  const point = (i: number): TilePoint => ({ x: i % size.width, y: Math.floor(i / size.width) });
  const footprintTiles = (kind: ObjectKind, x: number, y: number): number[] => {
    const { footprint } = OBJECT_REGISTRY[kind];
    const tiles: number[] = [];
    for (let dy = 0; dy < footprint.height; dy++) {
      for (let dx = 0; dx < footprint.width; dx++) tiles.push(toIndex(size, x + dx, y + dy));
    }
    return tiles;
  };
  const free = (i: number, onPath: boolean, inLot: boolean): boolean =>
    (inLot || !d.lots.has(i)) &&
    d.inside.has(i) &&
    (onPath || !d.pathTiles.has(i)) &&
    layer.occupancy[i] === NO_OBJECT &&
    (d.edgeDistance.get(i) ?? 0) >= 1;
  const place = (
    kind: ObjectKind,
    x: number,
    y: number,
    onPath = false,
    inLot = false,
  ): boolean => {
    const tiles = footprintTiles(kind, x, y);
    if (!tiles.every((i) => free(i, onPath, inLot))) return false;
    if (OBJECT_REGISTRY[kind].blocksMovement && !d.reachesDoors(new Set(tiles))) return false;
    addObject(layer, kind, x, y);
    return true;
  };
  const half = d.plazaHalf;
  // String lights across the plaza's top row (the garland hangs above it), the
  // well in the middle. Nothing stands right above or below the well, so tall
  // things never hide it: the stall goes to one side, benches (low) below.
  place('string_lights', plaza.x - half, plaza.y - half, true);
  if (!place('well', plaza.x - 1, plaza.y, true)) place('well', plaza.x, plaza.y, true);
  const sides = shuffled(rng, [
    { x: plaza.x - half - 3, y: plaza.y },
    { x: plaza.x + half + 1, y: plaza.y },
  ]);
  // Or one row clear below the plaza, far enough not to hide the well.
  const stallSpots = [...sides, { x: plaza.x - 1, y: plaza.y + half + 2 }];
  const stallAt = stallSpots.find((p) => place('market_stall', p.x, p.y));
  const benchSpots = [
    ...(stallAt?.y === plaza.y + half + 2 ? [] : [{ x: plaza.x - 1, y: plaza.y + half + 1 }]),
    ...sides.filter((p) => p !== stallAt),
    { x: plaza.x - half - 2, y: plaza.y + half },
    { x: plaza.x + half + 1, y: plaza.y + half },
  ];
  let benches = 0;
  for (const p of benchSpots) {
    if (benches >= 2) break;
    if (place('bench', p.x, p.y)) benches++;
  }
  // A barrel or crate beside each house.
  d.houses.forEach((house, n) => {
    const { footprint } = OBJECT_REGISTRY[house.kind];
    const side = rng.chance(0.5) ? house.x - 1 : house.x + footprint.width;
    place(n % 2 === 0 ? 'barrel' : 'crate', side, house.y + footprint.height - 1, false, true);
  });
  const freeTiles = (): number[] => [...d.inside].filter((i) => free(i, false, false));
  // Lamps beside the paths, spread out.
  const lamps: TilePoint[] = [plaza];
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
  // A haystack and a couple of stumps near the edge of the village.
  let stacks = 0;
  let stumps = 0;
  for (const i of shuffled(rng, freeTiles())) {
    if ((d.edgeDistance.get(i) ?? 0) > 2) continue;
    const p = point(i);
    if (stacks < 1 && place('haystack', p.x, p.y)) stacks++;
    else if (stumps < 2 && place('stump', p.x, p.y)) stumps++;
    if (stacks >= 1 && stumps >= 2) break;
  }
}
