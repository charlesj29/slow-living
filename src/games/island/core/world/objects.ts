// Object registry. Adding an object type = add a kind + a definition here (and
// a sprite in M2); placement steps refer to kinds and categories, not details.
import type { TilePoint } from '@/shared/engine/grid';

export const OBJECT_KINDS = [
  'tree_oak',
  'tree_pine',
  'flower_red',
  'flower_yellow',
  'flower_blue',
  'flower_white',
  'grass_tuft',
  'rock',
  'cabin',
] as const;

export type ObjectKind = (typeof OBJECT_KINDS)[number];

export type ObjectCategory = 'tree' | 'flower' | 'grass' | 'rock' | 'building';

export interface ObjectDefinition {
  readonly kind: ObjectKind;
  readonly name: string;
  readonly category: ObjectCategory;
  /** Tiles covered, measured from the object's top-left tile. */
  readonly footprint: { readonly width: number; readonly height: number };
  readonly blocksMovement: boolean;
  readonly spriteKey: string;
  /** Flat colour for map previews / minimaps. */
  readonly mapColor: string;
  /** Door tile, relative to the top-left of the footprint (buildings only). */
  readonly door?: TilePoint;
}

const SINGLE_TILE = { width: 1, height: 1 } as const;

function flower(kind: ObjectKind, name: string, mapColor: string): ObjectDefinition {
  return {
    kind,
    name,
    category: 'flower',
    footprint: SINGLE_TILE,
    blocksMovement: false,
    spriteKey: kind,
    mapColor,
  };
}

export const OBJECT_REGISTRY: Readonly<Record<ObjectKind, ObjectDefinition>> = {
  tree_oak: {
    kind: 'tree_oak',
    name: 'Oak tree',
    category: 'tree',
    footprint: SINGLE_TILE,
    blocksMovement: true,
    spriteKey: 'tree_oak',
    mapColor: '#2f6b2a',
  },
  tree_pine: {
    kind: 'tree_pine',
    name: 'Pine tree',
    category: 'tree',
    footprint: SINGLE_TILE,
    blocksMovement: true,
    spriteKey: 'tree_pine',
    mapColor: '#1c4a2c',
  },
  flower_red: flower('flower_red', 'Red flower', '#d64545'),
  flower_yellow: flower('flower_yellow', 'Yellow flower', '#f2d03b'),
  flower_blue: flower('flower_blue', 'Blue flower', '#5b7fe0'),
  flower_white: flower('flower_white', 'White flower', '#f4f4f4'),
  grass_tuft: {
    kind: 'grass_tuft',
    name: 'Grass tuft',
    category: 'grass',
    footprint: SINGLE_TILE,
    blocksMovement: false,
    spriteKey: 'grass_tuft',
    mapColor: '#86c46c',
  },
  rock: {
    kind: 'rock',
    name: 'Rock',
    category: 'rock',
    footprint: SINGLE_TILE,
    blocksMovement: true,
    spriteKey: 'rock',
    mapColor: '#8d8f94',
  },
  cabin: {
    kind: 'cabin',
    name: 'Wooden cabin',
    category: 'building',
    footprint: { width: 3, height: 3 },
    blocksMovement: true,
    spriteKey: 'cabin',
    mapColor: '#8b5a2b',
    door: { x: 1, y: 2 },
  },
};

export function kindsInCategory(category: ObjectCategory): readonly ObjectKind[] {
  return OBJECT_KINDS.filter((kind) => OBJECT_REGISTRY[kind].category === category);
}

export const TREE_KINDS: readonly ObjectKind[] = kindsInCategory('tree');
export const FLOWER_KINDS: readonly ObjectKind[] = kindsInCategory('flower');
