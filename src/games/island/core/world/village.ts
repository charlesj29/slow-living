// The small village near the cottage. Its shape changes per seed (an
// irregular fenced outline, made by `placeVillage`), so the world records it:
// the tiles inside the fence (as row spans) and the gate. Villagers walk only
// inside; generation and the game read the same record.
import { toIndex, type GridSize, type TilePoint } from '@/shared/engine/grid';
import { OBJECT_REGISTRY, type ObjectKind } from './objects';
import { getDoorFrontTile, type World, type WorldObject } from './world';

/** One row of the village's inside: tiles left..right (inclusive) on row y. */
export type VillageSpan = readonly [y: number, left: number, right: number];

export interface Village {
  /** The tiles inside the fence, row by row. */
  readonly interior: readonly VillageSpan[];
  /** The gap in the fence (on the side facing the nearest trail). */
  readonly gate: TilePoint;
}

export const VILLAGE_HOUSE_KINDS: readonly ObjectKind[] = [
  'house_stone',
  'house_log',
  'house_thatch',
];

/** Tile indexes inside the village fence. */
export function villageTiles(village: Village, size: GridSize): number[] {
  const tiles: number[] = [];
  for (const [y, left, right] of village.interior) {
    for (let x = left; x <= right; x++) tiles.push(toIndex(size, x, y));
  }
  return tiles;
}

/** Row spans from a set of tiles (the inverse of `villageTiles`). */
export function spansOf(tiles: Iterable<TilePoint>): VillageSpan[] {
  const rows = new Map<number, number[]>();
  for (const { x, y } of tiles) rows.set(y, [...(rows.get(y) ?? []), x]);
  const spans: VillageSpan[] = [];
  for (const [y, xs] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    const sorted = [...xs].sort((a, b) => a - b);
    let start = sorted[0] ?? 0;
    for (let i = 1; i <= sorted.length; i++) {
      const x = sorted[i];
      const previous = sorted[i - 1] ?? start;
      if (x === previous + 1) continue;
      spans.push([y, start, previous]);
      start = x ?? start;
    }
  }
  return spans;
}

export function villageHouses(world: Pick<World, 'objects'>): WorldObject[] {
  return world.objects
    .filter((object) => VILLAGE_HOUSE_KINDS.includes(object.kind))
    .sort((a, b) => a.x - b.x);
}

/** Rows a house's roof covers above its footprint: someone there looks as if on the roof. */
const ROOF_ROWS = 2;

/**
 * The village tiles people and animals wander on: the village area minus the
 * strips just behind each house (only their heads would show above the roof).
 */
export function wanderTiles(
  world: Pick<World, 'objects' | 'width' | 'height' | 'village'>,
): number[] {
  if (!world.village) return [];
  const behind = new Set<number>();
  for (const house of villageHouses(world)) {
    const { footprint } = OBJECT_REGISTRY[house.kind];
    for (let y = house.y - ROOF_ROWS; y < house.y; y++) {
      for (let x = house.x; x < house.x + footprint.width; x++) behind.add(toIndex(world, x, y));
    }
  }
  return villageTiles(world.village, world).filter((i) => !behind.has(i));
}

/** Where each villager starts: in front of a house's door. */
export function villagerSpawns(world: Pick<World, 'objects'>): TilePoint[] {
  return villageHouses(world)
    .filter((house) => OBJECT_REGISTRY[house.kind].door)
    .map((house) => getDoorFrontTile(house));
}
