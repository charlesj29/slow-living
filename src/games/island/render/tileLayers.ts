// Decides which sprites make up each map tile, bottom to top: the base tile,
// shoreline overlays from higher neighbours, then any top sprite (dock planks).
// Pure: no Three.js, so the rules are unit-tested.
import { isInBounds, toIndex, type GridSize } from '@/shared/engine/grid';
import { cliffPieceKey, type CliffSide } from '../assets/paintCliff';
import { WALL_PIECES } from '../assets/paintInterior';
import { getTileDefinition, isLandTile, TileId, type TileDefinition } from '../core/world/tiles';

export interface TerrainView extends GridSize {
  readonly terrain: Uint8Array;
}

/** What the tilemap needs from the atlas. */
export interface SpriteCatalog {
  has: (key: string) => boolean;
  /** Variant key for a base sprite at a tile (stable per tile). */
  variantAt: (base: string, x: number, y: number) => string;
}

const EDGES = [
  { name: 'n', dx: 0, dy: -1 },
  { name: 'e', dx: 1, dy: 0 },
  { name: 's', dx: 0, dy: 1 },
  { name: 'w', dx: -1, dy: 0 },
] as const;

const CORNERS = [
  { name: 'ne', dx: 1, dy: -1 },
  { name: 'se', dx: 1, dy: 1 },
  { name: 'sw', dx: -1, dy: 1 },
  { name: 'nw', dx: -1, dy: -1 },
] as const;

function tileIdAt(view: TerrainView, x: number, y: number): number | undefined {
  return isInBounds(view, x, y) ? view.terrain[toIndex(view, x, y)] : undefined;
}

/** The tile whose look counts for edges: the dock behaves like the water under it. */
function surfaceOf(id: number): TileDefinition {
  const definition = getTileDefinition(id);
  return definition.underlay === undefined ? definition : getTileDefinition(definition.underlay);
}

/** Dock boards run across the dock: horizontal runs (land or planks east/west) use the rotated sprite. */
function dockSpriteKey(view: TerrainView, x: number, y: number): string {
  const runsEastWest = [-1, 1].some((dx) => {
    const id = tileIdAt(view, x + dx, y);
    return id !== undefined && (id === TileId.Dock || isLandTile(id));
  });
  return runsEastWest ? 'tile_dock_h' : 'tile_dock_v';
}

function cliffSideAt(view: TerrainView, x: number, y: number): CliffSide {
  const id = tileIdAt(view, x, y);
  return id === TileId.Cliff ? 'ledge' : id === TileId.Sand ? 'sand' : 'grass';
}

/**
 * Walls show their face only where you can see it: just above the floor is
 * the lower wall (panelling), above that the upper wall (wallpaper, windows);
 * everywhere else the dark top of the wall.
 */
function wallSpriteKey(view: TerrainView, x: number, y: number): string {
  const below = tileIdAt(view, x, y + 1);
  const twoBelow = tileIdAt(view, x, y + 2);
  const isFloor = (id: number | undefined): boolean => id !== undefined && id !== TileId.Wall;
  if (isFloor(below)) return WALL_PIECES.lower;
  if (below === TileId.Wall && isFloor(twoBelow)) return WALL_PIECES.upper;
  return WALL_PIECES.top;
}

/** A ledge run's ends round off against the grass or beach beside them. */
function cliffSpriteKey(view: TerrainView, x: number, y: number): string {
  return cliffPieceKey(cliffSideAt(view, x - 1, y), cliffSideAt(view, x + 1, y));
}

export function tileLayersAt(
  view: TerrainView,
  x: number,
  y: number,
  sprites: SpriteCatalog,
): string[] {
  const ownId = tileIdAt(view, x, y) ?? TileId.DeepSea;
  const own = surfaceOf(ownId);
  const baseKey =
    ownId === TileId.Cliff
      ? cliffSpriteKey(view, x, y)
      : ownId === TileId.Wall
        ? wallSpriteKey(view, x, y)
        : own.spriteKey;
  const layers = [sprites.variantAt(baseKey, x, y)];

  const higherAt = (dx: number, dy: number): TileDefinition | null => {
    const id = tileIdAt(view, x + dx, y + dy);
    if (id === undefined) return null;
    const neighbor = surfaceOf(id);
    // Only materials with edge art spill over (a ledge outranks sand but draws its own foot).
    const spills = sprites.has(`edge_${neighbor.key}_n`);
    return spills && neighbor.edgePriority > own.edgePriority ? neighbor : null;
  };

  const overlays: { priority: number; key: string }[] = [];
  for (const edge of EDGES) {
    const neighbor = higherAt(edge.dx, edge.dy);
    if (neighbor)
      overlays.push({ priority: neighbor.edgePriority, key: `edge_${neighbor.key}_${edge.name}` });
  }
  for (const corner of CORNERS) {
    const neighbor = higherAt(corner.dx, corner.dy);
    // If either side already spills over this tile, its edge covers the corner.
    if (!neighbor || higherAt(corner.dx, 0) || higherAt(0, corner.dy)) continue;
    overlays.push({
      priority: neighbor.edgePriority,
      key: `corner_${neighbor.key}_${corner.name}`,
    });
  }
  overlays.sort((a, b) => a.priority - b.priority);
  for (const overlay of overlays) {
    if (sprites.has(overlay.key)) layers.push(sprites.variantAt(overlay.key, x, y));
  }

  if (ownId === TileId.Dock) layers.push(dockSpriteKey(view, x, y));
  return layers;
}
