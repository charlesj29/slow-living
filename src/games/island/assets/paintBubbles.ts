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

export const BUBBLE_KINDS: readonly BubbleKind[] = ['dots', 'smile', 'note', 'wave'];

export function paintBubbleSprites(): SpriteSource[] {
  return BUBBLE_KINDS.map((kind) => ({ key: bubbleKey(kind), frames: [bubble(kind)] }));
}
