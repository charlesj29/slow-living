import { hashCoords } from '@/shared/engine/random';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import type { SpriteCatalog } from './tileLayers';

/** Picks a stable sprite variant per tile/object position, so the same spot always looks the same. */
export function variantKeyAt(atlas: SpriteAtlas, base: string, x: number, y: number): string {
  const keys = atlas.variants(base);
  return keys[hashCoords(x, y) % keys.length] ?? base;
}

export function spriteCatalogFor(atlas: SpriteAtlas): SpriteCatalog {
  return {
    has: atlas.has,
    variantAt: (base, x, y) => variantKeyAt(atlas, base, x, y),
  };
}
