import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { PLAYER_HEIGHT, PLAYER_PALETTE, PLAYER_PIXEL_MAPS, PLAYER_WIDTH } from './playerPixels';

/** Atlas key of the player's animation strip for a direction (frames: stand, left step, right step). */
export function playerSpriteKey(direction: keyof typeof PLAYER_PIXEL_MAPS): string {
  return `player_${direction}`;
}

/** Turns a character-per-pixel map into a canvas. Throws on unknown characters or wrong sizes. */
export function paintPixelMap(
  rows: readonly string[],
  palette: Readonly<Record<string, string>>,
): PixelCanvas {
  if (rows.length !== PLAYER_HEIGHT)
    throw new Error(`Pixel map needs ${String(PLAYER_HEIGHT)} rows`);
  const canvas = createPixelCanvas(PLAYER_WIDTH, PLAYER_HEIGHT);
  rows.forEach((row, y) => {
    if (row.length !== PLAYER_WIDTH)
      throw new Error(`Row ${String(y)} must be ${String(PLAYER_WIDTH)} pixels`);
    [...row].forEach((char, x) => {
      if (char === '.') return;
      const hex = palette[char];
      if (!hex) throw new Error(`Unknown pixel "${char}" at (${String(x)}, ${String(y)})`);
      setPixel(canvas, x, y, hexToRgba(hex));
    });
  });
  return canvas;
}

export function paintPlayerSprites(): SpriteSource[] {
  return (Object.keys(PLAYER_PIXEL_MAPS) as (keyof typeof PLAYER_PIXEL_MAPS)[]).map(
    (direction) => ({
      key: playerSpriteKey(direction),
      frames: PLAYER_PIXEL_MAPS[direction].map((rows) => paintPixelMap(rows, PLAYER_PALETTE)),
    }),
  );
}
