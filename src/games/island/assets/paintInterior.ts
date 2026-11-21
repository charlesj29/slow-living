// Interior tiles (16×16): plank floor, walls and the doormat. A wall tile is
// drawn by what's below it (render/tileLayers.ts picks the piece): the upper
// back wall (striped wallpaper, sometimes a window), the lower back wall (wood
// panelling with a skirting board) or the dark top of a side/front wall.
import { createRng, hashString, type Rng } from '@/shared/engine/random';
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { fill, TILE_PX } from './paint';
import { PALETTE } from './palette';

export const WALL_PIECES = {
  upper: 'tile_wall_upper',
  lower: 'tile_wall_lower',
  top: 'tile_wall',
} as const;

const PLANK_HEIGHT = 4;

function floor(rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const wood = PALETTE.floorWood;
  fill(canvas, wood.base);
  for (let row = 0; row < TILE_PX / PLANK_HEIGHT; row++) {
    const y = row * PLANK_HEIGHT;
    fillRect(canvas, 0, y, TILE_PX, 1, wood.light);
    fillRect(canvas, 0, y + PLANK_HEIGHT - 1, TILE_PX, 1, wood.dark);
    // Plank ends, staggered row by row.
    const seam = (row * 7 + rng.int(0, 3)) % TILE_PX;
    fillRect(canvas, seam, y, 1, PLANK_HEIGHT - 1, wood.outline);
    for (let i = 0; i < 2; i++) setPixel(canvas, rng.int(0, 15), y + rng.int(1, 2), wood.dark);
  }
  return canvas;
}

function upperWall(withWindow: boolean): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const paper = PALETTE.wallpaper;
  fill(canvas, paper.base);
  for (let x = 1; x < TILE_PX; x += 4) fillRect(canvas, x, 0, 1, TILE_PX, paper.stripe);
  fillRect(canvas, 0, 0, TILE_PX, 2, PALETTE.wainscot.dark); // crown moulding
  if (withWindow) {
    fillRect(canvas, 3, 4, 10, 10, PALETTE.wainscot.dark);
    fillRect(canvas, 4, 5, 8, 8, PALETTE.cabin.glass);
    fillRect(canvas, 7, 5, 2, 8, PALETTE.wainscot.dark);
    fillRect(canvas, 4, 8, 8, 1, PALETTE.wainscot.dark);
    setPixel(canvas, 5, 6, PALETTE.cabin.shine);
    setPixel(canvas, 9, 6, PALETTE.cabin.shine);
  }
  return canvas;
}

function lowerWall(): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const wood = PALETTE.wainscot;
  fill(canvas, wood.base);
  fillRect(canvas, 0, 0, TILE_PX, 2, wood.light); // chair rail
  fillRect(canvas, 0, 2, TILE_PX, 1, wood.dark);
  for (const x of [1, 9]) {
    fillRect(canvas, x, 4, 6, 7, wood.dark);
    fillRect(canvas, x + 1, 5, 4, 5, wood.light);
  }
  fillRect(canvas, 0, 13, TILE_PX, 3, wood.dark); // skirting board
  fillRect(canvas, 0, 13, TILE_PX, 1, wood.light);
  return canvas;
}

function wallTop(rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  fill(canvas, PALETTE.wallTop.base);
  for (let i = 0; i < 4; i++)
    setPixel(canvas, rng.int(0, 15), rng.int(0, 15), PALETTE.wallTop.light);
  return canvas;
}

function doormat(rng: Rng): PixelCanvas {
  const canvas = floor(rng);
  const mat = PALETTE.doormat;
  fillRect(canvas, 2, 3, 12, 10, mat.dark);
  fillRect(canvas, 3, 4, 10, 8, mat.base);
  fillRect(canvas, 5, 6, 6, 4, mat.light);
  for (let x = 2; x < 14; x += 2) {
    setPixel(canvas, x, 2, mat.dark);
    setPixel(canvas, x, 13, mat.dark);
  }
  return canvas;
}

function variants(
  key: string,
  count: number,
  paint: (rng: Rng, i: number) => PixelCanvas,
): SpriteSource[] {
  return Array.from({ length: count }, (_, i) => {
    const variantKey = `${key}.${String(i)}`;
    return { key: variantKey, frames: [paint(createRng(hashString(variantKey)), i)] };
  });
}

export function paintInteriorSprites(): SpriteSource[] {
  return [
    ...variants('tile_floor', 3, (rng) => floor(rng)),
    // One window in every few wall tiles (variant 0 has one; the picker spreads them).
    ...variants(WALL_PIECES.upper, 3, (_rng, i) => upperWall(i === 0)),
    ...variants(WALL_PIECES.lower, 1, () => lowerWall()),
    ...variants(WALL_PIECES.top, 2, (rng) => wallTop(rng)),
    ...variants('tile_doormat', 1, (rng) => doormat(rng)),
  ];
}
