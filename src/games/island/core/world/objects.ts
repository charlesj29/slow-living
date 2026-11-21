// Object registry. Adding an object type = add a kind + a definition here (and
// a sprite in the atlas); placement steps refer to kinds and categories.
import type { TilePoint } from '@/shared/engine/grid';

export const OBJECT_KINDS = [
  'tree_oak',
  'tree_pine',
  'tree_giant',
  'tree_small',
  'bush',
  'flower_red',
  'flower_yellow',
  'flower_blue',
  'flower_white',
  'grass_tuft',
  'rock',
  'stump',
  'branch',
  'fence',
  'mailbox',
  'barrel',
  'flower_pot',
  'sign',
  'wood_pile',
  'stepping_stone',
  'cabin',
  'house_stone',
  'house_log',
  'house_thatch',
] as const;

export type ObjectKind = (typeof OBJECT_KINDS)[number];

/** `ground` = flat things lying on the ground (drawn under everything standing). */
export type ObjectCategory =
  'tree' | 'bush' | 'flower' | 'grass' | 'ground' | 'rock' | 'deadwood' | 'structure' | 'building';

export interface ObjectDefinition {
  readonly kind: ObjectKind;
  readonly name: string;
  readonly category: ObjectCategory;
  /**
   * Tiles that block movement / are occupied, from the object's top-left tile.
   * Sprites may be taller: they stand on the footprint's bottom edge and extend
   * upwards (a big tree's crown covers the row above its footprint).
   */
  readonly footprint: { readonly width: number; readonly height: number };
  readonly blocksMovement: boolean;
  readonly spriteKey: string;
  /** Flat colour for map previews / minimaps. */
  readonly mapColor: string;
  /** Door tile, relative to the top-left of the footprint (buildings only). */
  readonly door?: TilePoint;
  /** What pressing Space while facing it shows (no reply choices). */
  readonly interaction?: { readonly message: string };
}

const SINGLE_TILE = { width: 1, height: 1 } as const;
/** Village houses: 4×3 tiles, door on the bottom row, second tile from the left. */
const HOUSE_FOOTPRINT = { width: 4, height: 3 } as const;
const HOUSE_DOOR = { x: 1, y: 2 } as const;

function house(kind: ObjectKind, name: string, mapColor: string): ObjectDefinition {
  return {
    kind,
    name,
    category: 'building',
    footprint: HOUSE_FOOTPRINT,
    blocksMovement: true,
    spriteKey: kind,
    mapColor,
    door: HOUSE_DOOR,
  };
}

/** Big trees: 2 tiles wide at the trunk; the crown (drawn above) is walk-behind. */
const BIG_TREE_FOOTPRINT = { width: 2, height: 1 } as const;

function solid(
  kind: ObjectKind,
  name: string,
  category: ObjectCategory,
  mapColor: string,
  footprint: ObjectDefinition['footprint'] = SINGLE_TILE,
): ObjectDefinition {
  return { kind, name, category, footprint, blocksMovement: true, spriteKey: kind, mapColor };
}

function decoration(
  kind: ObjectKind,
  name: string,
  category: ObjectCategory,
  mapColor: string,
): ObjectDefinition {
  return {
    kind,
    name,
    category,
    footprint: SINGLE_TILE,
    blocksMovement: false,
    spriteKey: kind,
    mapColor,
  };
}

export const OBJECT_REGISTRY: Readonly<Record<ObjectKind, ObjectDefinition>> = {
  tree_oak: solid('tree_oak', 'Oak tree', 'tree', '#2f6b2a', BIG_TREE_FOOTPRINT),
  tree_pine: solid('tree_pine', 'Pine tree', 'tree', '#1c4a2c', BIG_TREE_FOOTPRINT),
  // A wide forest tree: same trunk footprint, a crown that spreads well past it.
  tree_giant: solid('tree_giant', 'Great tree', 'tree', '#2a5f28', BIG_TREE_FOOTPRINT),
  tree_small: solid('tree_small', 'Small tree', 'tree', '#3d7f35'),
  bush: solid('bush', 'Bush', 'bush', '#4c8f3e'),
  flower_red: decoration('flower_red', 'Red flowers', 'flower', '#d64545'),
  flower_yellow: decoration('flower_yellow', 'Yellow flowers', 'flower', '#f2d03b'),
  flower_blue: decoration('flower_blue', 'Blue flowers', 'flower', '#5b7fe0'),
  flower_white: decoration('flower_white', 'White flowers', 'flower', '#f4f4f4'),
  grass_tuft: decoration('grass_tuft', 'Grass tuft', 'grass', '#86c46c'),
  rock: solid('rock', 'Rock', 'rock', '#8d8f94'),
  stump: solid('stump', 'Tree stump', 'deadwood', '#7a5430'),
  branch: decoration('branch', 'Fallen branch', 'ground', '#6c4a28'),
  fence: solid('fence', 'Wooden fence', 'structure', '#d8bc8c'),
  mailbox: {
    ...solid('mailbox', 'Mailbox', 'structure', '#d04040'),
    interaction: { message: "It's empty." },
  },
  barrel: solid('barrel', 'Barrel', 'structure', '#9a6436'),
  flower_pot: solid('flower_pot', 'Flower pot', 'structure', '#cc6c3c'),
  sign: solid('sign', 'Wooden sign', 'structure', '#b8844c'),
  wood_pile: solid('wood_pile', 'Wood pile', 'structure', '#8a5a30'),
  stepping_stone: decoration('stepping_stone', 'Stepping stones', 'ground', '#a8a8b0'),
  cabin: {
    kind: 'cabin',
    name: 'Cottage',
    category: 'building',
    footprint: { width: 6, height: 4 },
    blocksMovement: true,
    spriteKey: 'cabin',
    mapColor: '#8b5a2b',
    door: { x: 2, y: 3 },
  },
  house_stone: house('house_stone', 'Stone house', '#7c8496'),
  house_log: house('house_log', 'Log cabin', '#7a5230'),
  house_thatch: house('house_thatch', 'Thatched house', '#c8a050'),
};

export function kindsInCategory(category: ObjectCategory): readonly ObjectKind[] {
  return OBJECT_KINDS.filter((kind) => OBJECT_REGISTRY[kind].category === category);
}

export const TREE_KINDS: readonly ObjectKind[] = kindsInCategory('tree');
export const FLOWER_KINDS: readonly ObjectKind[] = kindsInCategory('flower');
