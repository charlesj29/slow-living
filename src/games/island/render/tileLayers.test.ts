import { describe, expect, it } from 'vitest';
import { tileIdForMapChar } from '../core/world/tiles';
import { tileLayersAt, type SpriteCatalog, type TerrainView } from './tileLayers';

/** Builds a terrain view from map-file characters (`.` sand, `-` shallow sea, `,` grass, ...). */
function view(rows: readonly string[]): TerrainView {
  const width = rows[0]?.length ?? 0;
  const terrain = new Uint8Array(
    rows
      .join('')
      .split('')
      .map((char) => tileIdForMapChar(char) ?? 0),
  );
  return { width, height: rows.length, terrain };
}

const catalog: SpriteCatalog = { has: () => true, variantAt: (base) => base };
/** Like the real atlas: ledges have no edge art. */
const withoutCliffEdges: SpriteCatalog = {
  has: (key) => !key.startsWith('edge_cliff'),
  variantAt: (base) => base,
};

describe('tileLayersAt', () => {
  it('draws a plain tile when no neighbour is higher', () => {
    expect(tileLayersAt(view([',,,', ',,,', ',,,']), 1, 1, catalog)).toEqual(['tile_grass']);
  });

  it('spills a higher neighbour onto the edge it touches', () => {
    const layers = tileLayersAt(view(['...', '---', '---']), 1, 1, catalog);
    expect(layers).toEqual(['tile_shallow_sea', 'edge_sand_n']);
  });

  it('adds a rounded corner when the higher tile only touches diagonally', () => {
    const layers = tileLayersAt(view(['--.', '---', '---']), 1, 1, catalog);
    expect(layers).toEqual(['tile_shallow_sea', 'corner_sand_ne']);
  });

  it('skips the corner when an adjacent edge already covers it', () => {
    const layers = tileLayersAt(view(['-..', '---', '---']), 1, 1, catalog);
    expect(layers).toEqual(['tile_shallow_sea', 'edge_sand_n']);
  });

  it('stacks overlays from lowest to highest priority', () => {
    // Deep sea with shallow water to the west and sand to the north.
    const layers = tileLayersAt(view(['~.~', '-~~', '~~~']), 1, 1, catalog);
    expect(layers.slice(1)).toEqual(['edge_shallow_sea_w', 'edge_sand_n']);
  });

  it('picks ledge pieces by what is beside them, with nothing spilling over a ledge', () => {
    const rows = [',,,,,', ',^^^,', '.....'];
    expect(tileLayersAt(view(rows), 1, 1, withoutCliffEdges)).toEqual(['tile_cliff_gc']);
    expect(tileLayersAt(view(rows), 2, 1, withoutCliffEdges)).toEqual(['tile_cliff']);
    expect(tileLayersAt(view(rows), 3, 1, withoutCliffEdges)).toEqual(['tile_cliff_cg']);
    expect(tileLayersAt(view([',,,', ',^,', '...']), 1, 1, catalog)[0]).toBe('tile_cliff_gg');
    // A run ending against the beach rounds off onto sand.
    expect(tileLayersAt(view([',,,', '.^^', '...']), 1, 1, catalog)[0]).toBe('tile_cliff_sc');
  });

  it('keeps the beach below a ledge plain, but rounds grass corners beside it', () => {
    const rows = [',,,,,', ',^^^,', '.....'];
    expect(tileLayersAt(view(rows), 2, 2, withoutCliffEdges)).toEqual(['tile_sand']);
    expect(tileLayersAt(view(rows), 1, 2, withoutCliffEdges)).toEqual([
      'tile_sand',
      'corner_grass_nw',
    ]);
  });

  it('draws the dock over lake shallows, boards across the run direction', () => {
    const northSouth = tileLayersAt(view(['l.l', 'l#l', 'l#l']), 1, 1, catalog);
    expect(northSouth[0]).toBe('tile_lake_shallow');
    expect(northSouth.at(-1)).toBe('tile_dock_v');
    const eastWest = tileLayersAt(view(['lll', '.##', 'lll']), 1, 1, catalog);
    expect(eastWest.at(-1)).toBe('tile_dock_h');
  });

  it('leaves out overlays the atlas has no sprite for', () => {
    const sparse: SpriteCatalog = { has: (key) => !key.startsWith('edge_'), variantAt: (b) => b };
    expect(tileLayersAt(view(['...', '---', '---']), 1, 1, sparse)).toEqual(['tile_shallow_sea']);
  });
});
