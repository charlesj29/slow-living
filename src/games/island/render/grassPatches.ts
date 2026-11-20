// Soft patches of deeper grass. A smooth, map-wide noise value per tile is
// uploaded as a small texture; the tilemap shader samples it with bilinear
// filtering and compares it against a 4×4 ordered-dither pattern per art
// pixel, so patch edges dissolve in a pixel-art dither instead of following
// tile borders.
import { DataTexture, LinearFilter, RGBAFormat } from 'three';
import { createFractalNoise2D, type FractalNoiseOptions } from '@/shared/engine/noise';
import { createRng, hashString } from '@/shared/engine/random';

export interface GrassPatchSettings {
  readonly noise: FractalNoiseOptions;
  /** Patch value (0..1) above which grass pixels are shaded. */
  readonly threshold: number;
  /** Colour multiplier for shaded grass pixels (just below 1 = subtle). */
  readonly shade: number;
  /** How wide the dithered band at patch edges is, in patch-value units. */
  readonly ditherSpread: number;
}

const BYTE = 255;
const CHANNELS = 4;

/**
 * Sprites the patches apply to: grass tiles, grass edges over other ground and
 * rocky ledges (their grass lip must shade with the meadow above; a touch of
 * shade on the rock is invisible, a seam would not be).
 */
export function isGrassSprite(key: string): boolean {
  return /^(tile_grass|edge_grass_|corner_grass_|tile_cliff)/.test(key);
}

/** One 0..255 patch value per tile, deterministic for the map size. */
export function patchValues(width: number, height: number, noise: FractalNoiseOptions): Uint8Array {
  const sample = createFractalNoise2D(createRng(hashString('grass-patches')).next, noise);
  const values = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      values[y * width + x] = Math.round(sample(x, y) * BYTE);
    }
  }
  return values;
}

/** Texture row 0 is map row 0 (the shader flips world y to match). Caller disposes it. */
export function createPatchTexture(
  width: number,
  height: number,
  noise: FractalNoiseOptions,
): DataTexture {
  const values = patchValues(width, height, noise);
  const pixels = new Uint8Array(width * height * CHANNELS);
  values.forEach((value, index) => {
    pixels[index * CHANNELS] = value;
    pixels[index * CHANNELS + 3] = BYTE;
  });
  const texture = new DataTexture(pixels, width, height, RGBAFormat);
  // Bilinear on purpose: smooth values between tile centres give organic edges.
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
