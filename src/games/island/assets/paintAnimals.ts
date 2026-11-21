// Village animals, 16×16, facing left (mirrored to face right): a white
// chicken (stand, peck, two walk frames) and an orange cat (sit, two walk
// frames, curled up asleep). Feet sit on the bottom rows, like the characters.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  hexToRgba,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { fillEllipse } from './paint';

/** Frames per animal strip (see ANIMAL_FRAMES for which is which). */
export const ANIMAL_FRAME_COUNT = 4;

/** Frame indexes in both strips. */
export const ANIMAL_FRAMES = {
  chicken: { stand: 0, peck: 1, walk: [2, 3] },
  cat: { sit: 0, walk: [1, 2], sleep: 3 },
} as const;

const SIZE = 16;
const C = {
  outline: hexToRgba('#3a2a22'),
  white: hexToRgba('#f6f2ea'),
  whiteShade: hexToRgba('#d8d0c4'),
  comb: hexToRgba('#d64040'),
  beak: hexToRgba('#f2b030'),
  ginger: hexToRgba('#e08a3c'),
  gingerDark: hexToRgba('#b0602a'),
  gingerLight: hexToRgba('#f4b06a'),
  cream: hexToRgba('#f6e2c4'),
  eye: hexToRgba('#2a2420'),
} as const;

function chicken(frame: number): PixelCanvas {
  const c = createPixelCanvas(SIZE, SIZE);
  const peck = frame === ANIMAL_FRAMES.chicken.peck;
  // Body and tail.
  fillEllipse(c, 9, 10, 4.5, 3.2, C.outline);
  fillEllipse(c, 9, 10, 3.6, 2.4, C.white);
  fillRect(c, 12, 6, 2, 3, C.outline);
  fillRect(c, 12, 7, 1, 2, C.white);
  fillRect(c, 8, 11, 4, 1, C.whiteShade);
  // Head: up, or down to the ground when pecking.
  const hy = peck ? 10 : 6;
  const hx = peck ? 4 : 5;
  fillRect(c, hx - 1, hy - 1, 4, 4, C.outline);
  fillRect(c, hx, hy, 2, 2, C.white);
  setPixel(c, hx, hy, C.eye);
  setPixel(c, hx - 2, hy + 1, C.beak);
  setPixel(c, hx + 1, hy - 2, C.comb);
  setPixel(c, hx, hy - 2, C.comb);
  // Legs: together, or apart while walking.
  const apart =
    frame === ANIMAL_FRAMES.chicken.walk[0] ? 1 : frame === ANIMAL_FRAMES.chicken.walk[1] ? -1 : 0;
  fillRect(c, 8 + apart, 13, 1, 2, C.beak);
  fillRect(c, 10 - apart, 13, 1, 2, C.beak);
  return c;
}

function cat(frame: number): PixelCanvas {
  const c = createPixelCanvas(SIZE, SIZE);
  if (frame === ANIMAL_FRAMES.cat.sleep) {
    // Curled up: a round ginger loaf with the tail wrapped round.
    fillEllipse(c, 8, 12, 5.5, 3, C.outline);
    fillEllipse(c, 8, 12, 4.6, 2.2, C.ginger);
    fillRect(c, 5, 11, 6, 1, C.gingerLight);
    fillRect(c, 9, 13, 4, 1, C.gingerDark);
    setPixel(c, 4, 10, C.outline); // ears
    setPixel(c, 6, 10, C.outline);
    return c;
  }
  const sitting = frame === ANIMAL_FRAMES.cat.sit;
  if (sitting) {
    fillEllipse(c, 9, 11, 3.5, 3.6, C.outline);
    fillEllipse(c, 9, 11, 2.6, 2.7, C.ginger);
    fillRect(c, 8, 12, 2, 2, C.cream);
    fillRect(c, 12, 12, 3, 1, C.outline); // tail curled at the feet
  } else {
    fillEllipse(c, 9, 11, 5, 2.5, C.outline);
    fillEllipse(c, 9, 11, 4.1, 1.6, C.ginger);
    fillRect(c, 7, 11, 5, 1, C.gingerDark);
    fillRect(c, 13, 7, 1, 4, C.outline); // tail up
    const step = frame === ANIMAL_FRAMES.cat.walk[0] ? 1 : -1;
    for (const x of [6 + step, 11 - step]) fillRect(c, x, 13, 1, 2, C.outline);
  }
  // Head with pointy ears.
  const hy = sitting ? 5 : 7;
  fillRect(c, 4, hy, 5, 4, C.outline);
  fillRect(c, 5, hy + 1, 3, 2, C.ginger);
  setPixel(c, 4, hy - 1, C.outline);
  setPixel(c, 7, hy - 1, C.outline);
  setPixel(c, 5, hy + 1, C.eye);
  setPixel(c, 6, hy + 2, C.cream);
  return c;
}

export function paintAnimalSprites(): SpriteSource[] {
  const frames = Array.from({ length: ANIMAL_FRAME_COUNT }, (_, i) => i);
  return [
    { key: 'animal_chicken', frames: frames.map(chicken) },
    { key: 'animal_cat', frames: frames.map(cat) },
  ];
}
