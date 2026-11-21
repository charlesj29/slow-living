// In-world UI sprites: the small arrow that bobs above things you can
// interact with, pointing down at them like in classic RPGs, and the star
// over the studio until the first visit.
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
  return fromRows(ARROW_ROWS);
}

// prettier-ignore
const STAR_ROWS = [
  '.....o.....',
  '....oyo....',
  '....oyo....',
  'oooowyyoooo',
  'oywwwwyyyyo',
  '.oywwyyyyo.',
  '..oyyyyyo..',
  '..oyyoyyo..',
  '.oyyo.oyyo.',
  '.oyo...oyo.',
  '.oo.....oo.',
] as const;

/** Paints rows of 'o' (outline), 'w' (lit face) and 'y' (warm shade). */
function fromRows(rows: readonly string[]): PixelCanvas {
  const canvas = createPixelCanvas(rows[0]?.length ?? 0, rows.length);
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === 'o' || char === 'w' || char === 'y') setPixel(canvas, x, y, ARROW_COLORS[char]);
    });
  });
  return canvas;
}

export const PROMPT_KEY = 'prompt_interact';
/** The gold star that floats over the studio until the first visit. */
export const STUDIO_MARKER_KEY = 'marker_studio';

export function paintUiSprites(): SpriteSource[] {
  return [
    { key: PROMPT_KEY, frames: [arrow()] },
    { key: STUDIO_MARKER_KEY, frames: [fromRows(STAR_ROWS)] },
  ];
}
