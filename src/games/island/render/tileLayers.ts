// Decides which sprites make up each map tile, bottom to top: the base tile,
// shoreline overlays from higher neighbours, then any top sprite (dock planks).
// Pure: no Three.js, so the rules are unit-tested.
import { isInBounds, toIndex, type GridSize } from '@/shared/engine/grid';
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

export function tileLayersAt(
  view: TerrainView,
  x: number,
  y: number,
  sprites: SpriteCatalog,
): string[] {
  const ownId = tileIdAt(view, x, y) ?? TileId.DeepSea;
  const own = surfaceOf(ownId);
  const layers = [sprites.variantAt(own.spriteKey, x, y)];

  const higherAt = (dx: number, dy: number): TileDefinition | null => {
    const id = tileIdAt(view, x + dx, y + dy);
    if (id === undefined) return null;
    const neighbor = surfaceOf(id);
    return neighbor.edgePriority > own.edgePriority ? neighbor : null;
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
    if (sprites.has(overlay.key)) layers.push(overlay.key);
  }

  if (ownId === TileId.Dock) layers.push(dockSpriteKey(view, x, y));
  return layers;
}
