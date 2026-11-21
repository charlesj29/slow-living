// Object registry. Adding an object type = add a kind + a definition here (and
// a sprite in the atlas); placement steps refer to kinds and categories.
import type { TilePoint } from '@/shared/engine/grid';
import type { PanelId } from '../content/portfolio';
import { STUDIO_PANELS, type StudioPiece } from '../content/studio';

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
  'well',
  'haystack',
  'crate',
  'lamp_post',
  'crops',
  'bed',
  'table',
  'chair',
  'bookshelf',
  'fireplace',
  'rug',
  'plant',
  'floor_lamp',
  'desk_laptop',
  'phone_wall',
  'tech_shelf',
  'timeline_board',
  'trophy_shelf',
  'certificates',
  'post_desk',
  'cabin',
  'studio',
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
  /**
   * What pressing Space while facing it shows: one message box, page by page
   * (no reply choices). For buildings (things with a door) only the door answers.
   */
  readonly interaction?: Interaction;
  /** Hangs on an interior's back wall (its footprint is wall); you face it from the floor below. */
  readonly wallMounted?: boolean;
  /** A signpost: its message points to the island's landmarks (worked out per island). */
  readonly signpost?: boolean;
  /** Walking into the door leads into this interior (see core/world/interiors.ts). */
  readonly interior?: string;
  /** Glows at night: lit window panes / lantern glass get a warm overlay. */
  readonly litAtNight?: boolean;
}

/**
 * What Space shows: a message of one or more pages, or a part of the portfolio
 * in the panel. `pagePerTile`: each tile of the object opens its own page (the
 * wall of phones: one project per frame).
 */
export type Interaction =
  | { readonly pages: readonly string[] }
  | { readonly panel: PanelId; readonly pagePerTile?: boolean };

const SINGLE_TILE = { width: 1, height: 1 } as const;

/** A message of one or more pages. */
const says = (...pages: string[]): { readonly pages: readonly string[] } => ({ pages });

/** A portfolio piece in the studio: solid furniture that opens its part of the portfolio. */
function studioPiece(
  kind: StudioPiece,
  name: string,
  mapColor: string,
  width: number,
  wallMounted = false,
  pagePerTile = false,
): ObjectDefinition {
  return {
    ...solid(kind, name, 'structure', mapColor, { width, height: 1 }),
    interaction: { panel: STUDIO_PANELS[kind], ...(pagePerTile ? { pagePerTile } : {}) },
    ...(wallMounted ? { wallMounted } : {}),
  };
}
/** Village houses: 5×3 tiles, door in the middle of the bottom row. */
const HOUSE_FOOTPRINT = { width: 5, height: 3 } as const;
const HOUSE_DOOR = { x: 2, y: 2 } as const;

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
    litAtNight: true,
    interaction: says("It's locked. Someone lives here."),
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
    interaction: says("It's empty."),
  },
  barrel: solid('barrel', 'Barrel', 'structure', '#9a6436'),
  flower_pot: solid('flower_pot', 'Flower pot', 'structure', '#cc6c3c'),
  sign: { ...solid('sign', 'Signpost', 'structure', '#b8844c'), signpost: true },
  wood_pile: solid('wood_pile', 'Wood pile', 'structure', '#8a5a30'),
  stepping_stone: decoration('stepping_stone', 'Stepping stones', 'ground', '#a8a8b0'),
  // The village green's well: two tiles wide, its little roof rises above.
  well: solid('well', 'Well', 'structure', '#8c8c94', { width: 2, height: 1 }),
  haystack: solid('haystack', 'Haystack', 'structure', '#d8b85a'),
  crate: solid('crate', 'Crate', 'structure', '#a87a44'),
  lamp_post: { ...solid('lamp_post', 'Lamp post', 'structure', '#5a4630'), litAtNight: true },
  crops: solid('crops', 'Vegetable patch', 'structure', '#6a8a3a'),
  // Furniture (interiors). Wall pieces stand on the row in front of the back wall.
  bed: {
    ...solid('bed', 'Bed', 'structure', '#c84848', { width: 2, height: 2 }),
    interaction: says('Looks comfy. Maybe a nap later.'),
  },
  table: solid('table', 'Table', 'structure', '#9a6436', { width: 2, height: 1 }),
  chair: solid('chair', 'Chair', 'structure', '#9a6436'),
  bookshelf: {
    ...solid('bookshelf', 'Bookshelf', 'structure', '#7a4a28', { width: 2, height: 1 }),
    interaction: says('Rows of well-thumbed books.'),
  },
  fireplace: {
    ...solid('fireplace', 'Fireplace', 'structure', '#8c8c94', { width: 2, height: 1 }),
    interaction: says('The fire crackles softly.'),
    litAtNight: true,
  },
  rug: { ...decoration('rug', 'Rug', 'ground', '#b04a3a'), footprint: { width: 3, height: 2 } },
  plant: solid('plant', 'Potted plant', 'structure', '#4c8f3e'),
  floor_lamp: { ...solid('floor_lamp', 'Floor lamp', 'structure', '#e0c070'), litAtNight: true },
  // The Developer's Studio: each portfolio piece opens a part of the portfolio.
  desk_laptop: studioPiece('desk_laptop', 'Desk with laptop', '#9a6436', 2),
  phone_wall: studioPiece('phone_wall', 'Wall of framed phones', '#3a3a48', 5, true, true),
  tech_shelf: studioPiece('tech_shelf', 'Tech bookshelf', '#7a4a28', 2),
  timeline_board: studioPiece('timeline_board', 'Timeline board', '#c89a5c', 3, true),
  trophy_shelf: studioPiece('trophy_shelf', 'Trophy shelf', '#d8b040', 2),
  certificates: studioPiece('certificates', 'Framed certificates', '#e8dcc0', 2, true),
  post_desk: studioPiece('post_desk', 'Post desk', '#a8484a', 2),
  cabin: {
    kind: 'cabin',
    name: 'Cottage',
    category: 'building',
    footprint: { width: 6, height: 4 },
    blocksMovement: true,
    spriteKey: 'cabin',
    mapColor: '#8b5a2b',
    door: { x: 2, y: 3 },
    interior: 'cottage',
    litAtNight: true,
  },
  // A big workshop near the cottage, where Charles shows his work (interior: studio).
  studio: {
    kind: 'studio',
    name: "Developer's Studio",
    category: 'building',
    footprint: { width: 7, height: 4 },
    blocksMovement: true,
    spriteKey: 'studio',
    mapColor: '#3c6a78',
    door: { x: 3, y: 3 },
    interior: 'studio',
    litAtNight: true,
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
