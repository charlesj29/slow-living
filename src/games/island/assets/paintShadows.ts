// Soft cast shadows: semi-transparent shapes drawn over the ground under
// standing things (trees, bushes, rocks, the cabin, the player). They are the
// only translucent sprites; the tilemap draws them in their own blended layer.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import { createPixelCanvas, setPixel, type PixelCanvas } from '@/shared/render/pixelCanvas';
import { insideEllipse, TILE_PX } from './paint';
import { PALETTE } from './palette';

/** An ellipse with a darker core and a lighter one-pixel rim (reads as a soft edge). */
function ellipseShadow(width: number, height: number): PixelCanvas {
  const canvas = createPixelCanvas(width, height);
  const cx = width / 2;
  const cy = height / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!insideEllipse(x, y, cx, cy, cx, cy)) continue;
      const core = insideEllipse(x, y, cx, cy, cx - 1.5, cy - 1.2);
      setPixel(canvas, x, y, core ? PALETTE.castShadow.core : PALETTE.castShadow.edge);
    }
  }
  return canvas;
}

/** A rounded block for buildings: it peeks out along the right side and the bottom. */
function blockShadow(width: number, height: number): PixelCanvas {
  const canvas = createPixelCanvas(width, height);
  const radius = 3;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = Math.max(radius - x, 0, x - (width - 1 - radius));
      const dy = Math.max(radius - y, 0, y - (height - 1 - radius));
      const distance = Math.hypot(dx, dy);
      if (distance > radius) continue;
      const onRim =
        distance > radius - 1 || x === 0 || y === 0 || x === width - 1 || y === height - 1;
      setPixel(canvas, x, y, onRim ? PALETTE.castShadow.edge : PALETTE.castShadow.core);
    }
  }
  return canvas;
}

/** Shadow sprite keys, by size. */
export const SHADOW_KEYS = {
  large: 'shadow_large',
  medium: 'shadow_medium',
  small: 'shadow_small',
  cabin: 'shadow_cabin',
} as const;

/** The cabin's footprint in tiles (5×3); its shadow block matches it plus a margin. */
const CABIN_FOOTPRINT_TILES = { width: 5, height: 3 } as const;
const CABIN_SHADOW_MARGIN_PX = 8;

export function paintShadowSprites(): SpriteSource[] {
  return [
    { key: SHADOW_KEYS.large, frames: [ellipseShadow(36, 13)] },
    { key: SHADOW_KEYS.medium, frames: [ellipseShadow(18, 8)] },
    { key: SHADOW_KEYS.small, frames: [ellipseShadow(13, 6)] },
    {
      key: SHADOW_KEYS.cabin,
      frames: [
        blockShadow(
          CABIN_FOOTPRINT_TILES.width * TILE_PX + CABIN_SHADOW_MARGIN_PX,
          CABIN_FOOTPRINT_TILES.height * TILE_PX,
        ),
      ],
    },
  ];
}
