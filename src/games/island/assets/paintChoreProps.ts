// Little things villagers hold while they go about their day: a broom (two
// frames, sweeping), a water bucket, a fishing rod (seen sideways, from above
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
export const BROOM_FRAME_COUNT = 2;

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

// Brooms: the handle leans one way, then the other, as the bristles sweep.
// prettier-ignore
const BROOM = [
  ['...h..', '...h..', '...h..', '..h...', '..h...', '..h...', '..h...', '.h....', '.h....', '.h....', '.m....', 'osss..', 'ossd..', 'osdd..', 'oooo..', '......'],
  ['..h...', '..h...', '..h...', '...h..', '...h..', '...h..', '...h..', '....h.', '....h.', '....h.', '....m.', '..ssso', '..sddo', '..sddo', '..oooo', '......'],
];

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
    { key: CHORE_KEYS.broom, frames: BROOM.map(fromRows) },
    { key: CHORE_KEYS.bucket, frames: [fromRows(BUCKET)] },
    { key: CHORE_KEYS.rodSide, frames: [fromRows(ROD_SIDE)] },
    { key: CHORE_KEYS.rodDown, frames: [fromRows(ROD_DOWN)] },
    { key: CHORE_KEYS.rodUp, frames: [fromRows(ROD_UP)] },
    { key: CHORE_KEYS.bobber, frames: [fromRows(BOBBER)] },
    { key: CHORE_KEYS.book, frames: [fromRows(BOOK)] },
  ];
}
