// Object registry. Adding an object type = add a kind + a definition here (and
// a sprite in the atlas); placement steps refer to kinds and categories.
import type { TilePoint } from '@/shared/engine/grid';

export const OBJECT_KINDS = [
  'tree_oak',
  'tree_pine',
  'tree_small',
  'bush',
  'flower_red',
  'flower_yellow',
  'flower_blue',
  'flower_white',
  'grass_tuft',
  'rock',
  'fence',
  'mailbox',
  'cabin',
] as const;

export type ObjectKind = (typeof OBJECT_KINDS)[number];

export type ObjectCategory =
  'tree' | 'bush' | 'flower' | 'grass' | 'rock' | 'structure' | 'building';

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
}

const SINGLE_TILE = { width: 1, height: 1 } as const;
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
  tree_small: solid('tree_small', 'Small tree', 'tree', '#3d7f35'),
  bush: solid('bush', 'Bush', 'bush', '#4c8f3e'),
  flower_red: decoration('flower_red', 'Red flowers', 'flower', '#d64545'),
  flower_yellow: decoration('flower_yellow', 'Yellow flowers', 'flower', '#f2d03b'),
  flower_blue: decoration('flower_blue', 'Blue flowers', 'flower', '#5b7fe0'),
  flower_white: decoration('flower_white', 'White flowers', 'flower', '#f4f4f4'),
  grass_tuft: decoration('grass_tuft', 'Grass tuft', 'grass', '#86c46c'),
  rock: solid('rock', 'Rock', 'rock', '#8d8f94'),
  fence: solid('fence', 'Wooden fence', 'structure', '#d8bc8c'),
  mailbox: solid('mailbox', 'Mailbox', 'structure', '#d04040'),
  cabin: {
    kind: 'cabin',
    name: 'Wooden cabin',
    category: 'building',
    footprint: { width: 5, height: 3 },
    blocksMovement: true,
    spriteKey: 'cabin',
    mapColor: '#8b5a2b',
    door: { x: 2, y: 2 },
  },
};

export function kindsInCategory(category: ObjectCategory): readonly ObjectKind[] {
  return OBJECT_KINDS.filter((kind) => OBJECT_REGISTRY[kind].category === category);
}

export const TREE_KINDS: readonly ObjectKind[] = kindsInCategory('tree');
export const FLOWER_KINDS: readonly ObjectKind[] = kindsInCategory('flower');
