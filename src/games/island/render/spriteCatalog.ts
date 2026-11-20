import { hashCoords } from '@/shared/engine/random';
import type { SpriteAtlas } from '@/shared/render/spriteAtlas';
import type { SpriteCatalog } from './tileLayers';

/** Picks a stable sprite variant per tile/object position, so the same spot always looks the same. */
export function variantKeyAt(atlas: SpriteAtlas, base: string, x: number, y: number): string {
  const keys = atlas.variants(base);
  return keys[hashCoords(x, y) % keys.length] ?? base;
}

/** True if the atlas has the sprite itself or `base.N` variants of it. */
export function hasSprite(atlas: SpriteAtlas, key: string): boolean {
  return atlas.has(key) || atlas.variants(key)[0] !== key;
}

/** Sprite lookup for the tilemap: stable variants per tile, for tiles and overlay pieces. */
export function spriteCatalogFor(atlas: SpriteAtlas): SpriteCatalog {
  return {
    has: (key) => hasSprite(atlas, key),
    variantAt: (base, x, y) => variantKeyAt(atlas, base, x, y),
  };
}
