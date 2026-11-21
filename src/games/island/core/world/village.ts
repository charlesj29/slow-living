// The small village near the cottage: three houses side by side, their doors
// on a lane, with a strip of green in front where the villagers wander. The
// layout is shared by generation (placing it) and the game (where villagers
// may walk), so the two can never disagree.
import type { TilePoint } from '@/shared/engine/grid';
import { OBJECT_REGISTRY, type ObjectKind } from './objects';
import type { World, WorldObject } from './world';

export interface TileArea {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** Village layout in tiles, from the top-left of its area. */
export const VILLAGE_LAYOUT = {
  width: 18,
  height: 9,
  houses: [
    { kind: 'house_stone', x: 1, y: 1 },
    { kind: 'house_log', x: 7, y: 0 },
    { kind: 'house_thatch', x: 13, y: 1 },
  ] as const satisfies readonly { kind: ObjectKind; x: number; y: number }[],
  /** The lane in front of the doors. */
  laneRow: 5,
  /** Rows of green below the lane where villagers may also walk. */
  greenRows: 3,
} as const;

const FIRST_HOUSE = VILLAGE_LAYOUT.houses[0];
/** Rows from the houses' fronts down to the lane. */
const LANE_OFFSET = VILLAGE_LAYOUT.laneRow - (FIRST_HOUSE.y + 3);

export const VILLAGE_HOUSE_KINDS: readonly ObjectKind[] = VILLAGE_LAYOUT.houses.map((h) => h.kind);

export function villageHouses(world: Pick<World, 'objects'>): WorldObject[] {
  return world.objects
    .filter((object) => VILLAGE_HOUSE_KINDS.includes(object.kind))
    .sort((a, b) => a.x - b.x);
}

/**
 * Where villagers may walk: from just left of the first house to just right of
 * the last, between the houses' fronts and the bottom of the green. Null when
 * the world has no village.
 */
export function villageWanderArea(world: Pick<World, 'objects'>): TileArea | null {
  const houses = villageHouses(world);
  const first = houses[0];
  const last = houses.at(-1);
  if (!first || !last) return null;
  const bottomOf = (house: WorldObject): number =>
    house.y + OBJECT_REGISTRY[house.kind].footprint.height - 1;
  const top = Math.max(...houses.map(bottomOf)) + 1;
  return {
    left: first.x - FIRST_HOUSE.x,
    right: last.x + OBJECT_REGISTRY[last.kind].footprint.width,
    top,
    bottom: top + LANE_OFFSET + VILLAGE_LAYOUT.greenRows,
  };
}

/** Where each villager starts: on the lane, below a house's door. */
export function villagerSpawns(world: Pick<World, 'objects'>): TilePoint[] {
  const area = villageWanderArea(world);
  if (!area) return [];
  const laneY = area.top + LANE_OFFSET;
  return villageHouses(world).map((house) => ({
    x: house.x + (OBJECT_REGISTRY[house.kind].door?.x ?? 0),
    y: laneY,
  }));
}
