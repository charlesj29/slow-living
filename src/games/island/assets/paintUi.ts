// In-world UI sprites: the small arrow that bobs above things you can
// interact with, pointing down at them like in classic RPGs.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';

const ARROW_COLORS = {
  o: hexToRgba('#3a2416'), // outline
  w: hexToRgba('#fff6e0'), // lit face
  y: hexToRgba('#f8c040'), // warm shade on the lower half
} as const;

// prettier-ignore
const ARROW_ROWS = [
  'ooooooooo',
  'owwwwwwwo',
  '.owwwwwo.',
  '..oyyyo..',
  '...oyo...',
  '....o....',
] as const;

/** 9×6: a down-pointing arrowhead with a dark outline. */
function arrow(): PixelCanvas {
  const canvas = createPixelCanvas(ARROW_ROWS[0].length, ARROW_ROWS.length);
  ARROW_ROWS.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === 'o' || char === 'w' || char === 'y') setPixel(canvas, x, y, ARROW_COLORS[char]);
    });
  });
  return canvas;
}

export const PROMPT_KEY = 'prompt_interact';

export function paintUiSprites(): SpriteSource[] {
  return [{ key: PROMPT_KEY, frames: [arrow()] }];
}
