import {
  CARDINAL_DIRECTIONS,
  forEachNeighbor,
  isInBounds,
  toIndex,
  type GridSize,
  type TilePoint,
} from '@/shared/engine/grid';
import { OBJECT_REGISTRY } from '../../world/objects';
import { TileId } from '../../world/tiles';
import { VILLAGE_LAYOUT, type TileArea } from '../../world/village';
import { getDoorFrontTile, NO_OBJECT, type WorldObject } from '../../world/world';
import type { GenerationContext, GenerationStep } from '../context';
import { addObject, objectLayerWithout } from '../objectLayer';

/** Keep a tile of clear ground all round the village. */
const MARGIN = 1;

function areaAt(origin: TilePoint, margin: number): TileArea {
  return {
    left: origin.x - margin,
    top: origin.y - margin,
    right: origin.x + VILLAGE_LAYOUT.width - 1 + margin,
    bottom: origin.y + VILLAGE_LAYOUT.height - 1 + margin,
  };
}

function forEachTile(area: TileArea, visit: (x: number, y: number) => void): void {
  for (let y = area.top; y <= area.bottom; y++) {
    for (let x = area.left; x <= area.right; x++) visit(x, y);
  }
}

/**
 * Inside the fence: free grass only (a trail must not be fenced off). The
 * margin round it may also be trail (trail tiles are reserved, which is fine
 * there). No water, beach, ledge or cottage yard anywhere.
 */
function isClearSite(context: GenerationContext, origin: TilePoint): boolean {
  const inner = areaAt(origin, 0);
  let clear = true;
  forEachTile(areaAt(origin, MARGIN), (x, y) => {
    if (!clear) return;
    if (!isInBounds(context.size, x, y)) {
      clear = false;
      return;
    }
    const index = toIndex(context.size, x, y);
    const id = context.terrain[index];
    const freeGrass = id === TileId.Grass && context.reserved[index] === 0;
    const isInner = x >= inner.left && x <= inner.right && y >= inner.top && y <= inner.bottom;
    clear = freeGrass || (!isInner && id === TileId.Path);
  });
  for (const house of VILLAGE_LAYOUT.houses) {
    const { footprint } = OBJECT_REGISTRY[house.kind];
    forEachTile(
      {
        left: origin.x + house.x,
        top: origin.y + house.y,
        right: origin.x + house.x + footprint.width - 1,
        bottom: origin.y + house.y + footprint.height - 1,
      },
      (x, y) => {
        clear &&= context.terrain[toIndex(context.size, x, y)] === TileId.Grass;
      },
    );
  }
  return clear;
}

function intersects(object: WorldObject, area: TileArea): boolean {
  const { footprint } = OBJECT_REGISTRY[object.kind];
  return (
    object.x <= area.right &&
    object.x + footprint.width - 1 >= area.left &&
    object.y <= area.bottom &&
    object.y + footprint.height - 1 >= area.top
  );
}

/**
 * Breadth-first from `start` across tiles `canCross` allows, to the nearest
 * tile `isGoal` accepts. Returns the route (start first, goal excluded), or null.
 */
function shortestRouteTo(
  size: GridSize,
  start: number,
  isGoal: (index: number) => boolean,
  canCross: (index: number) => boolean,
): number[] | null {
  if (isGoal(start)) return [];
  if (!canCross(start)) return null;
  const cameFrom = new Map<number, number>([[start, -1]]);
  const queue = [start];
  // The queue grows while it is walked, which a for-of loop over an array follows.
  for (const current of queue) {
    let found = -1;
    forEachNeighbor(size, current, CARDINAL_DIRECTIONS, (next) => {
      if (found !== -1 || cameFrom.has(next)) return;
      if (isGoal(next)) {
        found = current;
        return;
      }
      if (!canCross(next)) return;
      cameFrom.set(next, current);
      queue.push(next);
    });
    if (found !== -1) {
      const route: number[] = [];
      for (let step = found; step !== -1; step = cameFrom.get(step) ?? -1) route.push(step);
      return route.reverse();
    }
  }
  return null;
}

/**
 * The village: a fenced square with three houses around a green and its
 * decorations, at the first clear spot among `village.offsets` near the
 * cottage. Runs after the forests, clearing only its own patch (so the rest of
 * the island is untouched), then joins the gate to the nearest existing trail
 * with a short new stretch of path.
 */
export const placeVillage: GenerationStep = (context) => {
  const { cabin, config, size } = context;
  if (!cabin) return context;
  const origin = config.village.offsets
    .map((offset) => ({ x: cabin.x + offset.x, y: cabin.y + offset.y }))
    .find((candidate) => isClearSite(context, candidate));
  if (!origin) return context;

  const site = areaAt(origin, MARGIN);
  const layer = objectLayerWithout(context, (object) => intersects(object, site));
  const houses = VILLAGE_LAYOUT.houses.map((house) =>
    addObject(layer, house.kind, origin.x + house.x, origin.y + house.y),
  );
  for (const prop of VILLAGE_LAYOUT.props) {
    addObject(layer, prop.kind, origin.x + prop.x, origin.y + prop.y);
  }
  // The fence round the edge, open at the gate.
  const fence = areaAt(origin, 0);
  const gate = { x: origin.x + VILLAGE_LAYOUT.gate.x, y: origin.y + VILLAGE_LAYOUT.gate.y };
  forEachTile(fence, (x, y) => {
    const onEdge = x === fence.left || x === fence.right || y === fence.top || y === fence.bottom;
    if (onEdge && !(x === gate.x && y === gate.y)) addObject(layer, 'fence', x, y);
  });

  const terrain = context.terrain.slice();
  const reserved = context.reserved.slice();
  forEachTile(site, (x, y) => (reserved[toIndex(size, x, y)] = 1));
  const laneY = origin.y + VILLAGE_LAYOUT.laneRow;
  // From the gate to the last tile inside the right fence.
  for (let x = gate.x; x < origin.x + VILLAGE_LAYOUT.width - 1; x++) {
    terrain[toIndex(size, x, laneY)] = TileId.Path;
  }
  for (const house of houses) {
    const front = getDoorFrontTile(house);
    for (let y = front.y; y < laneY; y++) terrain[toIndex(size, front.x, y)] = TileId.Path;
  }

  // Join the gate to the nearest existing trail (they all lead to the cottage door).
  // Trail from before the village (the new lane isn't in `context.terrain` yet).
  const isTrail = (index: number): boolean => context.terrain[index] === TileId.Path;
  const canCross = (index: number): boolean =>
    layer.occupancy[index] === NO_OBJECT && terrain[index] === TileId.Grass;
  const route = shortestRouteTo(size, toIndex(size, gate.x - 1, gate.y), isTrail, canCross);
  for (const index of route ?? []) {
    if (terrain[index] === TileId.Grass) terrain[index] = TileId.Path;
    reserved[index] = 1;
  }

  const newCabin = layer.objects.find((object) => object.kind === 'cabin') ?? cabin;
  return {
    ...context,
    terrain,
    reserved,
    objects: layer.objects,
    occupancy: layer.occupancy,
    cabin: newCabin,
  };
};
