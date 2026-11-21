// Soft cast shadows: semi-transparent shapes drawn over the ground under
// standing things (trees, bushes, rocks, the cabin, the player). They are the
// only translucent sprites; the tilemap draws them in their own blended layer.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import { createPixelCanvas, setPixel, type PixelCanvas } from '@/shared/render/pixelCanvas';
import { OBJECT_REGISTRY } from '../core/world/objects';
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
  xlarge: 'shadow_xlarge',
  large: 'shadow_large',
  medium: 'shadow_medium',
  small: 'shadow_small',
  cabin: 'shadow_cabin',
  house: 'shadow_house',
  studio: 'shadow_studio',
} as const;

/** The cottage's shadow block matches its footprint plus a margin. */
const CABIN_FOOTPRINT_TILES = OBJECT_REGISTRY.cabin.footprint;
/** Narrower than the footprint: with light from the top-left only the right and bottom show. */
const CABIN_SHADOW_MARGIN_PX = -8;
/** Village houses share one footprint, so one block fits them all. */
const HOUSE_FOOTPRINT_TILES = OBJECT_REGISTRY.house_stone.footprint;
const STUDIO_FOOTPRINT_TILES = OBJECT_REGISTRY.studio.footprint;

export function paintShadowSprites(): SpriteSource[] {
  return [
    { key: SHADOW_KEYS.xlarge, frames: [ellipseShadow(50, 17)] },
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
    {
      key: SHADOW_KEYS.house,
      frames: [
        blockShadow(
          HOUSE_FOOTPRINT_TILES.width * TILE_PX + CABIN_SHADOW_MARGIN_PX,
          HOUSE_FOOTPRINT_TILES.height * TILE_PX,
        ),
      ],
    },
    {
      key: SHADOW_KEYS.studio,
      frames: [
        blockShadow(
          STUDIO_FOOTPRINT_TILES.width * TILE_PX + CABIN_SHADOW_MARGIN_PX,
          STUDIO_FOOTPRINT_TILES.height * TILE_PX,
        ),
      ],
    },
  ];
}
