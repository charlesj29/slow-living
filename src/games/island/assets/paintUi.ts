// In-world UI sprites: the little "E" key that floats over things you can
// interact with. Painted like a keyboard keycap: light top, darker front edge.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  hexToRgba,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';

const KEYCAP = {
  outline: hexToRgba('#3a2416'),
  face: hexToRgba('#fff6e0'),
  shine: hexToRgba('#ffffff'),
  edge: hexToRgba('#d9c39a'),
  letter: hexToRgba('#3a2416'),
};

/** 11×12: a rounded keycap with an "E" on it. */
function promptKey(): PixelCanvas {
  const canvas = createPixelCanvas(11, 12);
  const { outline, face, shine, edge, letter } = KEYCAP;
  fillRect(canvas, 1, 0, 9, 12, outline);
  fillRect(canvas, 0, 1, 11, 10, outline);
  fillRect(canvas, 1, 1, 9, 9, face);
  fillRect(canvas, 1, 8, 9, 3, edge); // the key's front edge, in shade
  fillRect(canvas, 1, 1, 9, 1, shine);
  // The letter E, 4×5.
  fillRect(canvas, 3, 2, 1, 5, letter);
  fillRect(canvas, 4, 2, 3, 1, letter);
  fillRect(canvas, 4, 4, 2, 1, letter);
  fillRect(canvas, 4, 6, 3, 1, letter);
  return canvas;
}

export const PROMPT_KEY = 'prompt_interact';

export function paintUiSprites(): SpriteSource[] {
  return [{ key: PROMPT_KEY, frames: [promptKey()] }];
}
