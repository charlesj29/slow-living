// Little things villagers hold while they go about their day: a broom (seen
// from the side, sweeping the ground in front, four frames), a water bucket, a fishing rod (seen sideways, from above
// pointing down, or pointing up away from us) with its bobber, and a book.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';

export const CHORE_KEYS = {
  broom: 'chore_broom',
  bucket: 'chore_bucket',
  rodSide: 'chore_rod_side',
  rodDown: 'chore_rod_down',
  rodUp: 'chore_rod_up',
  bobber: 'chore_bobber',
  book: 'chore_book',
} as const;
export const BROOM_FRAME_COUNT = 4;
/** The broom sprite (side view, facing right): the hands hold the top-left corner. */
export const BROOM_SPRITE = { width: 16, height: 14 } as const;

const C: Readonly<Record<string, Rgba>> = {
  h: hexToRgba('#7a4a28'), // wood: broom handle, rod
  s: hexToRgba('#e0b85a'), // straw
  d: hexToRgba('#b88a36'), // straw, shaded
  o: hexToRgba('#4a2e1c'), // outline
  m: hexToRgba('#8c8c94'), // metal band
  w: hexToRgba('#5aa2e0'), // water
  l: hexToRgba('#d8dde4'), // fishing line
  r: hexToRgba('#e04848'), // bobber red
  b: hexToRgba('#fff6e0'), // bobber white, book pages
  c: hexToRgba('#4f7fc0'), // book cover
  u: hexToRgba('#d8c8a0'), // a puff of dust
};

function fromRows(rows: readonly string[]): PixelCanvas {
  const canvas = createPixelCanvas(rows[0]?.length ?? 0, rows.length);
  rows.forEach((row, y) => {
    [...row].forEach((letter, x) => {
      const color = C[letter];
      if (color) setPixel(canvas, x, y, color);
    });
  });
  return canvas;
}

/**
 * One frame of sweeping, seen from the side (facing right): the handle runs
 * from the hands (top left) down to the bristles on the ground, which swing
 * forward and back; at the far end of a stroke a little dust puffs up behind.
 */
function broomFrame(tipX: number, dust: boolean): PixelCanvas {
  const { width, height } = BROOM_SPRITE;
  const canvas = createPixelCanvas(width, height);
  const put = (x: number, y: number, letter: string): void => {
    const color = C[letter];
    if (color && x >= 0 && x < width && y >= 0 && y < height) setPixel(canvas, x, y, color);
  };
  // The handle, hands to bristles.
  const steps = 9;
  for (let i = 0; i <= steps; i++) put(Math.round(1 + ((tipX - 1) * i) / steps), i, 'h');
  put(tipX, 10, 'm');
  // Bristles fanning out on the ground.
  for (let x = tipX - 1; x <= tipX + 1; x++) put(x, 11, 's');
  for (let x = tipX - 2; x <= tipX + 2; x++) put(x, 12, x % 2 === 0 ? 's' : 'd');
  for (let x = tipX - 2; x <= tipX + 2; x++) put(x, 13, 'o');
  put(tipX - 2, 11, 'o');
  put(tipX + 2, 11, 'o');
  if (dust) {
    put(tipX - 4, 12, 'u');
    put(tipX - 5, 11, 'u');
    put(tipX - 3, 10, 'u');
  }
  return canvas;
}

/** Where the bristles are in each frame: a stroke forward, then back. */
const BROOM_TIPS = [6, 9, 12, 9] as const;

// prettier-ignore
const BUCKET = ['.oooooo.', 'owwwwwwo', 'ohwwwwho', '.ohhhho.', '.ommmmo.', '.ohhhho.', '..oooo..', '........'];

// Rods start at the hand (one end) and the line hangs from the tip.
// prettier-ignore
const ROD_SIDE = [
  '.............h..', '............h.l.', '..........hh..l.', '........hh....l.', '......hh......l.',
  '....hh........l.', '..hh..........l.', 'oh............l.', '..............l.', '..............l.', '..............l.', '................',
];
// prettier-ignore
const ROD_DOWN = ['oh......', '.h......', '..h.....', '..h.....', '...h....', '...h....', '....h...', '....h...', '.....h..', '.....h..', '......h.', '......l.', '......l.', '......l.', '......l.', '........'];
// prettier-ignore
const ROD_UP = ['......l.', '......l.', '......h.', '......h.', '.....h..', '.....h..', '....h...', '....h...', '...h....', '...h....', '..h.....', '..h.....', '.h......', '.h......', 'oh......', '........'];

// prettier-ignore
const BOBBER = ['.rr.', 'rrrr', 'bbbb', '.bb.'];
// prettier-ignore
const BOOK = ['.bbbb.', 'cbbbbc', 'cbbbbc', 'cccccc'];

export function paintChorePropSprites(): SpriteSource[] {
  return [
    { key: CHORE_KEYS.broom, frames: BROOM_TIPS.map((tip, i) => broomFrame(tip, i === 2)) },
    { key: CHORE_KEYS.bucket, frames: [fromRows(BUCKET)] },
    { key: CHORE_KEYS.rodSide, frames: [fromRows(ROD_SIDE)] },
    { key: CHORE_KEYS.rodDown, frames: [fromRows(ROD_DOWN)] },
    { key: CHORE_KEYS.rodUp, frames: [fromRows(ROD_UP)] },
    { key: CHORE_KEYS.bobber, frames: [fromRows(BOBBER)] },
    { key: CHORE_KEYS.book, frames: [fromRows(BOOK)] },
  ];
}
