// Tile registry. Adding a terrain type = add an id + a definition here (and a
// sprite in M2). Logic asks the registry instead of comparing ids directly.

export const TileId = {
  DeepSea: 0,
  ShallowSea: 1,
  Sand: 2,
  Grass: 3,
  LakeWater: 4,
  LakeShallow: 5,
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
}

/** Indexed by TileId (verified by tests). */
export const TILE_DEFINITIONS: readonly TileDefinition[] = [
  {
    id: TileId.DeepSea,
    key: 'deep_sea',
    name: 'Deep sea',
    isWalkable: false,
    waterBody: 'sea',
    spriteKey: 'tile_deep_sea',
    mapColor: '#1f4e79',
  },
  {
    id: TileId.ShallowSea,
    key: 'shallow_sea',
    name: 'Shallow sea',
    isWalkable: false,
    waterBody: 'sea',
    spriteKey: 'tile_shallow_sea',
    mapColor: '#3f86c4',
  },
  {
    id: TileId.Sand,
    key: 'sand',
    name: 'Sand',
    isWalkable: true,
    waterBody: null,
    spriteKey: 'tile_sand',
    mapColor: '#e3d29b',
  },
  {
    id: TileId.Grass,
    key: 'grass',
    name: 'Grass',
    isWalkable: true,
    waterBody: null,
    spriteKey: 'tile_grass',
    mapColor: '#6aa84f',
  },
  {
    id: TileId.LakeWater,
    key: 'lake_water',
    name: 'Lake water',
    isWalkable: false,
    waterBody: 'lake',
    spriteKey: 'tile_lake_water',
    mapColor: '#25808f',
  },
  {
    id: TileId.LakeShallow,
    key: 'lake_shallow',
    name: 'Lake shallows',
    isWalkable: false,
    waterBody: 'lake',
    spriteKey: 'tile_lake_shallow',
    mapColor: '#4fb0b8',
  },
];

export function getTileDefinition(id: number): TileDefinition {
  const definition = TILE_DEFINITIONS[id];
  if (!definition) {
    throw new RangeError(`Unknown tile id: ${String(id)}`);
  }
  return definition;
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
