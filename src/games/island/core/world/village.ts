// The small village near the cottage: a fenced square with three houses
// around a green (one at the top, two lower left and right), their doors
// joined by short paths to a lane that leaves through a gate in the fence.
// The layout is shared by generation (placing it) and the game (where
// villagers may walk), so the two can never disagree.
import type { TilePoint } from '@/shared/engine/grid';
import { OBJECT_REGISTRY, type ObjectKind } from './objects';
import type { World, WorldObject } from './world';

export interface TileArea {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

interface Placement {
  readonly kind: ObjectKind;
  readonly x: number;
  readonly y: number;
}

/**
 * Village layout in tiles, from the top-left corner of its fence. The fence
 * runs round the edge (width × height), with a gate where the lane leaves.
 */
export const VILLAGE_LAYOUT = {
  width: 20,
  height: 15,
  houses: [
    { kind: 'house_log', x: 7, y: 2 },
    { kind: 'house_stone', x: 1, y: 5 },
    { kind: 'house_thatch', x: 13, y: 5 },
  ] as const satisfies readonly Placement[],
  /** The lane in front of the houses, leaving through the gate in the left fence. */
  laneRow: 10,
  gate: { x: 0, y: 10 },
  /** Decorations, kept off every path. */
  props: [
    { kind: 'well', x: 9, y: 12 },
    { kind: 'haystack', x: 17, y: 13 },
    { kind: 'haystack', x: 18, y: 12 },
    { kind: 'crops', x: 2, y: 12 },
    { kind: 'crops', x: 3, y: 12 },
    { kind: 'crops', x: 4, y: 12 },
    { kind: 'crops', x: 2, y: 13 },
    { kind: 'crops', x: 3, y: 13 },
    { kind: 'crops', x: 4, y: 13 },
    { kind: 'lamp_post', x: 1, y: 9 },
    { kind: 'lamp_post', x: 12, y: 9 },
    { kind: 'lamp_post', x: 7, y: 11 },
    { kind: 'lamp_post', x: 18, y: 9 },
    { kind: 'flower_pot', x: 8, y: 5 },
    { kind: 'flower_pot', x: 10, y: 5 },
    { kind: 'flower_pot', x: 2, y: 8 },
    { kind: 'flower_pot', x: 4, y: 8 },
    { kind: 'flower_pot', x: 14, y: 8 },
    { kind: 'flower_pot', x: 16, y: 8 },
    { kind: 'barrel', x: 6, y: 4 },
    { kind: 'barrel', x: 18, y: 7 },
    { kind: 'crate', x: 12, y: 4 },
    { kind: 'crate', x: 6, y: 7 },
    { kind: 'stump', x: 3, y: 2 },
    { kind: 'stump', x: 15, y: 2 },
    { kind: 'stump', x: 13, y: 12 },
  ] satisfies readonly Placement[],
} as const;

const ANCHOR = VILLAGE_LAYOUT.houses[0];

export const VILLAGE_HOUSE_KINDS: readonly ObjectKind[] = VILLAGE_LAYOUT.houses.map((h) => h.kind);

export function villageHouses(world: Pick<World, 'objects'>): WorldObject[] {
  return world.objects
    .filter((object) => VILLAGE_HOUSE_KINDS.includes(object.kind))
    .sort((a, b) => a.x - b.x);
}

/** The village's top-left fence corner, found from where its first house stands. */
export function villageOrigin(world: Pick<World, 'objects'>): TilePoint | null {
  const anchor = world.objects.find((object) => object.kind === ANCHOR.kind);
  return anchor ? { x: anchor.x - ANCHOR.x, y: anchor.y - ANCHOR.y } : null;
}

/** Where villagers may walk: inside the fence. Null when the world has no village. */
export function villageWanderArea(world: Pick<World, 'objects'>): TileArea | null {
  const origin = villageOrigin(world);
  if (!origin) return null;
  return {
    left: origin.x + 1,
    top: origin.y + 1,
    right: origin.x + VILLAGE_LAYOUT.width - 2,
    bottom: origin.y + VILLAGE_LAYOUT.height - 2,
  };
}

/** Where each villager starts: on the lane, below a house's door. */
export function villagerSpawns(world: Pick<World, 'objects'>): TilePoint[] {
  const origin = villageOrigin(world);
  if (!origin) return [];
  return villageHouses(world).map((house) => ({
    x: house.x + (OBJECT_REGISTRY[house.kind].door?.x ?? 0),
    y: origin.y + VILLAGE_LAYOUT.laneRow,
  }));
}
