import { describe, expect, it } from 'vitest';
import { createPixelCanvas } from '@/shared/render/pixelCanvas';
import { buildSpriteAtlas } from '@/shared/render/spriteAtlas';
import { spriteCatalogFor } from './spriteCatalog';

const tile = (): ReturnType<typeof createPixelCanvas> => createPixelCanvas(16, 16);
const atlas = buildSpriteAtlas([
  { key: 'tile_grass.0', frames: [tile()] },
  { key: 'tile_grass.1', frames: [tile()] },
  { key: 'tile_dock_h', frames: [tile()] },
]);

describe('spriteCatalogFor', () => {
  it('treats a sprite with variants as present', () => {
    const catalog = spriteCatalogFor(atlas);
    expect(catalog.has('tile_grass')).toBe(true);
    expect(catalog.has('tile_dock_h')).toBe(true);
    expect(catalog.has('tile_rock')).toBe(false);
  });

  it('is stable: the same tile always gets the same variant', () => {
    const catalog = spriteCatalogFor(atlas);
    expect(catalog.variantAt('tile_grass', 7, 9)).toBe(catalog.variantAt('tile_grass', 7, 9));
    expect(['tile_grass.0', 'tile_grass.1']).toContain(catalog.variantAt('tile_grass', 7, 9));
  });

  it('returns sprites without variants unchanged', () => {
    expect(spriteCatalogFor(atlas).variantAt('tile_dock_h', 3, 3)).toBe('tile_dock_h');
  });
});
