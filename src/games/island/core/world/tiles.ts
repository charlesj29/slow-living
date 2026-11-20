// Tile registry. Adding a terrain type = add an id + a definition here (and a
// sprite in the atlas). Logic asks the registry instead of comparing ids directly.

export const TileId = {
  DeepSea: 0,
  ShallowSea: 1,
  Sand: 2,
  Grass: 3,
  LakeWater: 4,
  LakeShallow: 5,
  Path: 6,
  Dock: 7,
} as const;

export type TileId = (typeof TileId)[keyof typeof TileId];

/** Which body of water a tile belongs to; lakes are fresh water, kept distinct from the sea. */
export type WaterBody = 'sea' | 'lake';

export interface TileDefinition {
  readonly id: TileId;
  readonly key: string;
  readonly name: string;
  readonly isWalkable: boolean;
  readonly waterBody: WaterBody | null;
  readonly spriteKey: string;
  /** Flat colour for map previews / minimaps. */
  readonly mapColor: string;
  /** Single character used for this tile in map files (readable, diff-friendly). */
  readonly mapChar: string;
  /**
   * Smooth shorelines: where two tiles meet, the one with the higher priority
   * spills a rounded edge over the lower one (grass over sand, sand over water).
   */
  readonly edgePriority: number;
  /** Drawn on top of this tile (e.g. dock planks over lake shallows); edges use the underlay. */
  readonly underlay?: TileId;
}

function tile(
  id: TileId,
  key: string,
  name: string,
  traits: Pick<TileDefinition, 'isWalkable' | 'waterBody' | 'mapColor' | 'mapChar'>,
  edgePriority: number,
  underlay?: TileId,
): TileDefinition {
  const definition = { id, key, name, spriteKey: `tile_${key}`, edgePriority, ...traits };
  return underlay === undefined ? definition : { ...definition, underlay };
}

const water = (waterBody: WaterBody, mapColor: string, mapChar: string) =>
  ({ isWalkable: false, waterBody, mapColor, mapChar }) as const;
const ground = (mapColor: string, mapChar: string) =>
  ({ isWalkable: true, waterBody: null, mapColor, mapChar }) as const;

/** Indexed by TileId (verified by tests). */
export const TILE_DEFINITIONS: readonly TileDefinition[] = [
  tile(TileId.DeepSea, 'deep_sea', 'Deep sea', water('sea', '#1f4e79', '~'), 0),
  tile(TileId.ShallowSea, 'shallow_sea', 'Shallow sea', water('sea', '#3f86c4', '-'), 1),
  tile(TileId.Sand, 'sand', 'Sand', ground('#e3d29b', '.'), 2),
  tile(TileId.Grass, 'grass', 'Grass', ground('#6aa84f', ','), 3),
  tile(TileId.LakeWater, 'lake_water', 'Lake water', water('lake', '#25808f', 'L'), 0),
  tile(TileId.LakeShallow, 'lake_shallow', 'Lake shallows', water('lake', '#4fb0b8', 'l'), 1),
  tile(TileId.Path, 'path', 'Dirt path', ground('#b08a5a', '='), 2),
  // Planks over water: walkable and not part of any water body.
  tile(TileId.Dock, 'dock', 'Wooden dock', ground('#8a6238', '#'), 1, TileId.LakeShallow),
];

export function getTileDefinition(id: number): TileDefinition {
  const definition = TILE_DEFINITIONS[id];
  if (!definition) {
    throw new RangeError(`Unknown tile id: ${String(id)}`);
  }
  return definition;
}

const TILE_ID_BY_CHAR = new Map(TILE_DEFINITIONS.map((d) => [d.mapChar, d.id]));

/** Tile id for a map-file character, or undefined if the character is unknown. */
export function tileIdForMapChar(char: string): TileId | undefined {
  return TILE_ID_BY_CHAR.get(char);
}

export function isWaterTile(id: number): boolean {
  return getTileDefinition(id).waterBody !== null;
}

export function isSeaTile(id: number): boolean {
  return getTileDefinition(id).waterBody === 'sea';
}

export function isLakeTile(id: number): boolean {
  return getTileDefinition(id).waterBody === 'lake';
}

export function isLandTile(id: number): boolean {
  return getTileDefinition(id).waterBody === null;
}

export function isWalkableTile(id: number): boolean {
  return getTileDefinition(id).isWalkable;
}
