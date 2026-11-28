// Little speech bubbles over villagers' heads: chatting (…), a smile, humming
// (a note), and a wave. Cream paper with a dark-wood outline, like the message
// box, with a small tail pointing down at the speaker.
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
export const BUBBLE_SPRITE = { width: 14, height: 12 } as const;

const COLORS: Readonly<Record<string, Rgba>> = {
  o: hexToRgba('#3a2416'),
  c: hexToRgba('#fff6e0'),
  i: hexToRgba('#5a3a24'),
  r: hexToRgba('#d9675a'),
  f: hexToRgba('#f08a3e'),
  e: hexToRgba('#2a1a14'),
};

// The bubble: a rounded box (rows 0–9) and a tail (rows 10–11); icons go in rows 2–7.
// prettier-ignore
const BUBBLE = [
  '..oooooooooo..',
  '.occcccccccco.',
  'occcccccccccco',
  'occcccccccccco',
  'occcccccccccco',
  'occcccccccccco',
  'occcccccccccco',
  'occcccccccccco',
  '.occcccccccco.',
  '..oocooooooo..',
  '...oco........',
  '....o.........',
];

/** Icon pixels inside the bubble, as [x, y, colour letter]. */
// prettier-ignore
const ICONS: Readonly<Record<BubbleKind, readonly (readonly [number, number, string])[]>> = {
  dots: [[3, 5, 'i'], [4, 5, 'i'], [6, 5, 'i'], [7, 5, 'i'], [9, 5, 'i'], [10, 5, 'i']],
  smile: [
    [4, 3, 'i'], [9, 3, 'i'],
    [3, 5, 'i'], [10, 5, 'i'], [4, 6, 'i'], [9, 6, 'i'], [5, 7, 'i'], [6, 7, 'i'], [7, 7, 'i'], [8, 7, 'i'],
  ],
  note: [
    [8, 2, 'i'], [9, 2, 'i'], [8, 3, 'i'], [10, 3, 'i'], [8, 4, 'i'], [8, 5, 'i'], [8, 6, 'i'],
    [5, 6, 'i'], [6, 6, 'i'], [7, 6, 'i'], [5, 7, 'i'], [6, 7, 'i'], [7, 7, 'i'],
  ],
  // A little caught fish, nose to the left.
  fish: [
    [5, 3, 'f'], [6, 3, 'f'], [7, 3, 'f'], [10, 3, 'f'],
    [4, 4, 'f'], [5, 4, 'e'], [6, 4, 'f'], [7, 4, 'f'], [8, 4, 'f'], [9, 4, 'f'], [10, 4, 'f'],
    [3, 5, 'f'], [4, 5, 'f'], [5, 5, 'f'], [6, 5, 'f'], [7, 5, 'f'], [8, 5, 'f'], [9, 5, 'f'],
    [4, 6, 'f'], [5, 6, 'f'], [6, 6, 'f'], [7, 6, 'f'], [8, 6, 'f'], [9, 6, 'f'], [10, 6, 'f'],
    [5, 7, 'f'], [6, 7, 'f'], [7, 7, 'f'], [10, 7, 'f'],
  ],
  // A little heart.
  heart: [
    [4, 3, 'r'], [5, 3, 'r'], [8, 3, 'r'], [9, 3, 'r'],
    [3, 4, 'r'], [4, 4, 'r'], [5, 4, 'r'], [6, 4, 'r'], [7, 4, 'r'], [8, 4, 'r'], [9, 4, 'r'], [10, 4, 'r'],
    [3, 5, 'r'], [4, 5, 'r'], [5, 5, 'r'], [6, 5, 'r'], [7, 5, 'r'], [8, 5, 'r'], [9, 5, 'r'], [10, 5, 'r'],
    [4, 6, 'r'], [5, 6, 'r'], [6, 6, 'r'], [7, 6, 'r'], [8, 6, 'r'], [9, 6, 'r'],
    [5, 7, 'r'], [6, 7, 'r'], [7, 7, 'r'], [8, 7, 'r'], [6, 8, 'r'], [7, 8, 'r'],
    [4, 4, 'c'],
  ],
  wave: [
    [5, 2, 'i'], [7, 2, 'i'], [9, 2, 'i'], [5, 3, 'i'], [7, 3, 'i'], [9, 3, 'i'],
    [5, 4, 'i'], [6, 4, 'i'], [7, 4, 'i'], [8, 4, 'i'], [9, 4, 'i'], [4, 5, 'i'],
    [5, 5, 'i'], [6, 5, 'i'], [7, 5, 'i'], [8, 5, 'i'], [9, 5, 'i'], [5, 6, 'i'], [6, 6, 'i'],
    [7, 6, 'i'], [8, 6, 'i'], [2, 3, 'r'], [2, 5, 'r'], [11, 3, 'r'], [11, 5, 'r'],
  ],
};

function bubble(kind: BubbleKind): PixelCanvas {
  const canvas = createPixelCanvas(BUBBLE_SPRITE.width, BUBBLE_SPRITE.height);
  BUBBLE.forEach((row, y) => {
    [...row].forEach((letter, x) => {
      const color = COLORS[letter];
      if (color) setPixel(canvas, x, y, color);
    });
  });
  for (const [x, y, letter] of ICONS[kind]) {
    const color = COLORS[letter];
    if (color) setPixel(canvas, x, y, color);
  }
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
