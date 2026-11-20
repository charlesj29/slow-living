import { DataTexture, NearestFilter, RGBAFormat } from 'three';
import { layoutAtlas, type AtlasFrame, type SpriteSource } from './atlasLayout';

/**
 * Sprites by key, backed by one texture. Rendering code only ever asks for keys
 * like "tree_oak" or "tile_grass.1"; whether pixels were painted in code or
 * loaded from a PNG is invisible to it.
 *
 * Variants use the naming convention `base.N` (e.g. `tile_grass.0`,
 * `tile_grass.1`); `variants("tile_grass")` lists them.
 */
export interface SpriteAtlas {
  readonly texture: DataTexture;
  has: (key: string) => boolean;
  /** Throws for unknown keys, so missing art fails loudly instead of rendering garbage. */
  frame: (key: string) => AtlasFrame;
  /** Keys of `base.N` variants in order, or `[base]` if the sprite has no variants. */
  variants: (base: string) => readonly string[];
  dispose: () => void;
}

function groupVariants(keys: Iterable<string>): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const key of keys) {
    const match = /^(.*)\.(\d+)$/.exec(key);
    if (!match) continue;
    const base = match[1] ?? key;
    const list = groups.get(base) ?? [];
    list[Number(match[2])] = key;
    groups.set(base, list);
  }
  return groups;
}

export function buildSpriteAtlas(sources: readonly SpriteSource[]): SpriteAtlas {
  const { image, frames } = layoutAtlas(sources);
  // Colours are used exactly as painted: the canvas renders in linear/flat mode,
  // so no colour-space conversion happens anywhere.
  const texture = new DataTexture(image.data, image.width, image.height, RGBAFormat);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const variantGroups = groupVariants(frames.keys());
  return {
    texture,
    has: (key) => frames.has(key),
    frame: (key) => {
      const frame = frames.get(key);
      if (!frame) throw new Error(`Sprite "${key}" is not in the atlas`);
      return frame;
    },
    variants: (base) => variantGroups.get(base) ?? [base],
    dispose: () => {
      texture.dispose();
    },
  };
}
