// Little speech bubbles over villagers' (and the kid's and the puppy's) heads:
// chatting (…), a smile, humming (two notes), a waving hand, a caught fish and
// a heart. Cream paper with a dark-wood outline, like the message box, with a
// small tail pointing down at the speaker; big enough to read at a glance.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';
import type { BubbleKind } from '../core/entities/villager';

export const bubbleKey = (kind: BubbleKind): string => `bubble_${kind}`;
export const BUBBLE_SPRITE = { width: 18, height: 15 } as const;

const COLORS: Readonly<Record<string, Rgba>> = {
  o: hexToRgba('#3a2416'),
  c: hexToRgba('#fff6e0'),
  i: hexToRgba('#5a3a24'),
  r: hexToRgba('#d9675a'),
  s: hexToRgba('#f8c8a0'),
  S: hexToRgba('#e0a47c'),
  f: hexToRgba('#f08a3e'),
  e: hexToRgba('#2a1a14'),
  w: hexToRgba('#ffffff'),
};

// The bubble: a rounded box (rows 0–12) and a tail (rows 12–14).
// prettier-ignore
const BUBBLE = [
  '..oooooooooooooo..',
  '.occcccccccccccco.',
  'occcccccccccccccco',
  'occcccccccccccccco',
  'occcccccccccccccco',
  'occcccccccccccccco',
  'occcccccccccccccco',
  'occcccccccccccccco',
  'occcccccccccccccco',
  'occcccccccccccccco',
  'occcccccccccccccco',
  '.occcccccccccccco.',
  '..oocooooooooooo..',
  '...oco............',
  '....o.............',
];

/** Where the icons go inside the bubble (their top-left), and their size. */
const ICON_AT = { x: 3, y: 2 } as const;

// Icons, 12×9, one letter per pixel ('.' leaves the paper showing).
// prettier-ignore
const ICONS: Readonly<Record<BubbleKind, readonly string[]>> = {
  dots: [
    '............',
    '............',
    '............',
    '.ii..ii..ii.',
    '.ii..ii..ii.',
    '............',
    '............',
    '............',
    '............',
  ],
  smile: [
    '............',
    '...i....i...',
    '...i....i...',
    '............',
    '.ri......ir.',
    '..i......i..',
    '...iiiiii...',
    '............',
    '............',
  ],
  // Two quavers joined by a beam.
  note: [
    '....iiiiiii.',
    '....iiiiiii.',
    '....i.....i.',
    '....i.....i.',
    '....i.....i.',
    '..iii...iii.',
    '.iiii..iiii.',
    '..ii....ii..',
    '............',
  ],
  // An open hand, waving: four fingers, a thumb, a little motion mark.
  wave: [
    '...i.i.i.i..',
    'r.isisisisi.',
    '..isisisisi.',
    'i.isisisisi.',
    'isisssssssi.',
    'isssssssssir',
    '.isssssssSi.',
    '..isssssSi..',
    '...iiiiii...',
  ],
  // A little caught fish, nose to the left.
  fish: [
    '............',
    '............',
    '...ffff.....',
    '.ffffffff.f.',
    'fefffffffff.',
    '.ffffffff.f.',
    '...ffff.....',
    '............',
    '............',
  ],
  heart: [
    '............',
    '..rrr..rrr..',
    '.rwrrrrrrrr.',
    '.rrrrrrrrrr.',
    '..rrrrrrrr..',
    '...rrrrrr...',
    '....rrrr....',
    '.....rr.....',
    '............',
  ],
};

function paint(canvas: PixelCanvas, rows: readonly string[], left: number, top: number): void {
  rows.forEach((row, y) => {
    [...row].forEach((letter, x) => {
      const color = COLORS[letter];
      if (color) setPixel(canvas, left + x, top + y, color);
    });
  });
}

function bubble(kind: BubbleKind): PixelCanvas {
  const canvas = createPixelCanvas(BUBBLE_SPRITE.width, BUBBLE_SPRITE.height);
  paint(canvas, BUBBLE, 0, 0);
  paint(canvas, ICONS[kind], ICON_AT.x, ICON_AT.y);
  return canvas;
}

export const BUBBLE_KINDS: readonly BubbleKind[] = [
  'dots',
  'smile',
  'note',
  'wave',
  'fish',
  'heart',
];

export function paintBubbleSprites(): SpriteSource[] {
  return BUBBLE_KINDS.map((kind) => ({ key: bubbleKey(kind), frames: [bubble(kind)] }));
}
