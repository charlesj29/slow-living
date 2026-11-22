// A washing line: two wooden posts with a sagging rope between them, and a
// shirt, a striped sheet and a towel pegged to it. Four frames of a gentle
// sway: the cloth's lower edges swing out and back (top rows stay pegged).
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';

export const LAUNDRY_KEY = 'laundry_line';
/** Sway offsets of the cloth's bottom row (pixels), one per frame. */
const SWAY = [0, 1, 2, 1] as const;
export const LAUNDRY_FRAME_COUNT = SWAY.length;

const WIDTH = 48;
const HEIGHT = 32;
const POSTS = [3, 44] as const;
const POST_TOP = 7;
/** Where the rope hangs at a column (it sags in the middle). */
const ropeY = (x: number): number =>
  POST_TOP + 2 + Math.round(3 * Math.sin((Math.PI * (x - POSTS[0])) / (POSTS[1] - POSTS[0])));

const WOOD = hexToRgba('#7a4a28');
const WOOD_DARK = hexToRgba('#4a2e1c');
const ROPE = hexToRgba('#d8d0c0');
const PEG = hexToRgba('#5a4630');

interface Cloth {
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly color: Rgba;
  readonly shade: Rgba;
  /** A stripe row (sheet) or none. */
  readonly stripe?: { readonly row: number; readonly color: Rgba };
  /** Shirt sleeves stick out at the top. */
  readonly sleeves?: boolean;
}

const CLOTHES: readonly Cloth[] = [
  {
    left: 8,
    width: 9,
    height: 10,
    color: hexToRgba('#8fb8de'),
    shade: hexToRgba('#6a92ba'),
    sleeves: true,
  },
  {
    left: 20,
    width: 11,
    height: 13,
    color: hexToRgba('#f3ecd8'),
    shade: hexToRgba('#d6cdb4'),
    stripe: { row: 9, color: hexToRgba('#e09a9a') },
  },
  {
    left: 34,
    width: 7,
    height: 8,
    color: hexToRgba('#f2d98a'),
    shade: hexToRgba('#d4b862'),
  },
];

function hangCloth(canvas: PixelCanvas, cloth: Cloth, sway: number): void {
  const top = ropeY(cloth.left + Math.floor(cloth.width / 2)) + 1;
  for (let row = 0; row < cloth.height; row++) {
    // Lower rows swing further out.
    const shift = Math.round((sway * row) / Math.max(1, cloth.height - 1));
    for (let col = 0; col < cloth.width; col++) {
      const edge = col === 0 || col === cloth.width - 1 || row === cloth.height - 1;
      const striped = cloth.stripe && row === cloth.stripe.row;
      const color = edge
        ? cloth.shade
        : striped
          ? (cloth.stripe?.color ?? cloth.color)
          : cloth.color;
      setPixel(canvas, cloth.left + col + shift, top + row, color);
    }
  }
  if (cloth.sleeves) {
    for (const col of [-2, -1, cloth.width, cloth.width + 1]) {
      setPixel(canvas, cloth.left + col, top + 1, cloth.shade);
      setPixel(canvas, cloth.left + col, top + 2, cloth.color);
    }
  }
  // Pegs at the top corners.
  setPixel(canvas, cloth.left + 1, top - 1, PEG);
  setPixel(canvas, cloth.left + cloth.width - 2, top - 1, PEG);
}

function laundryFrame(sway: number): PixelCanvas {
  const canvas = createPixelCanvas(WIDTH, HEIGHT);
  for (const post of POSTS) {
    for (let y = POST_TOP; y < HEIGHT; y++) {
      setPixel(canvas, post - 1, y, WOOD_DARK);
      setPixel(canvas, post, y, WOOD);
    }
    setPixel(canvas, post - 1, POST_TOP - 1, WOOD_DARK);
    setPixel(canvas, post, POST_TOP - 1, WOOD_DARK);
  }
  for (let x = POSTS[0] + 1; x < POSTS[1]; x++) setPixel(canvas, x, ropeY(x), ROPE);
  for (const cloth of CLOTHES) hangCloth(canvas, cloth, sway);
  return canvas;
}

export function paintLaundrySprites(): SpriteSource[] {
  return [{ key: LAUNDRY_KEY, frames: SWAY.map(laundryFrame) }];
}
