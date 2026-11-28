// Little emote balloons over villagers' (and the kid's and the puppy's) heads,
// in a cosy game style: a small rounded cream balloon with a dark outline, a
// soft shade along the bottom and right, and a tiny tail pointing down at the
// speaker. The icons are drawn from soft round shapes with their own outline
// (like the animals): chat dots, a smiley, a musical note, a waving hand, a
// caught fish and a heart.
//
// Size: a 13×12 balloon (narrower than a character, 16, so it sits lightly over
// a head) with well-rounded corners, holding a 9×9 icon; the tail adds two rows.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';
import type { BubbleKind } from '../core/entities/villager';
import { capsule, ellipse, outline, put, softGrid, type SoftGrid } from './softShapes';

export const bubbleKey = (kind: BubbleKind): string => `bubble_${kind}`;

const BALLOON = { width: 13, height: 12 } as const;
const TAIL_ROWS = 2;
export const BUBBLE_SPRITE = { width: BALLOON.width, height: BALLOON.height + TAIL_ROWS } as const;
/** The icon's size and where it goes in the balloon. */
const ICON = 9;
const ICON_AT = { x: 2, y: 1 } as const;
/** The tail sits under the balloon's left third, pointing down at the speaker. */
const TAIL_X = 4;

const COLORS: Readonly<Record<string, Rgba>> = {
  // The balloon.
  O: hexToRgba('#3a2416'),
  c: hexToRgba('#fff8e6'),
  C: hexToRgba('#ecdcbc'),
  // Icon outline, shine and ink.
  o: hexToRgba('#3a2416'),
  w: hexToRgba('#ffffff'),
  k: hexToRgba('#3a2a22'),
  // Smiley.
  y: hexToRgba('#ffd84a'),
  Y: hexToRgba('#e8a830'),
  p: hexToRgba('#f59a8a'),
  // Hand.
  s: hexToRgba('#fbd0a8'),
  S: hexToRgba('#e0a47c'),
  // Fish.
  f: hexToRgba('#f59a42'),
  F: hexToRgba('#d0682a'),
  // Heart.
  r: hexToRgba('#e8505a'),
  R: hexToRgba('#b8343e'),
};

/** How far each row's ends are pulled in, for the balloon's round corners. */
const INSET = [2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2] as const;

function balloon(canvas: PixelCanvas): void {
  const paint = (x: number, y: number, letter: string): void => {
    const color = COLORS[letter];
    if (color) setPixel(canvas, x, y, color);
  };
  const last = BALLOON.height - 1;
  const right = (inset: number): number => BALLOON.width - 1 - inset;
  for (let y = 0; y < BALLOON.height; y++) {
    const inset = INSET[y] ?? 0;
    // A step in the round corner: this row reaches further out than the row above or below.
    const above = INSET[y - 1] ?? BALLOON.width;
    const below = INSET[y + 1] ?? BALLOON.width;
    for (let x = inset; x <= right(inset); x++) {
      const edge =
        y === 0 ||
        y === last ||
        x === inset ||
        x === right(inset) ||
        x < above ||
        x > right(above) ||
        x < below ||
        x > right(below);
      const shade = y === last - 1 || x === right(inset) - 1;
      paint(x, y, edge ? 'O' : shade ? 'C' : 'c');
    }
  }
  // The tail: an opening in the bottom edge, then a little point.
  paint(TAIL_X, last, 'C');
  paint(TAIL_X - 1, last + 1, 'O');
  paint(TAIL_X, last + 1, 'C');
  paint(TAIL_X + 1, last + 1, 'O');
  paint(TAIL_X, last + 2, 'O');
}

function smile(): SoftGrid {
  const g = softGrid(ICON, ICON);
  // A little smaller than the balloon's inside, so the face floats with room round it.
  ellipse(g, 4, 4.5, 3.1, 3.1, 'y'); // flat yellow: a shaded edge would weigh down the smile
  put(g, 2, 3, 'w'); // shine
  put(g, 3, 4, 'k'); // eyes
  put(g, 5, 4, 'k');
  put(g, 3, 5, 'k'); // a small smile: the corners up, the middle down
  put(g, 4, 6, 'k');
  put(g, 5, 5, 'k');
  put(g, 2, 5.4, 'p'); // rosy cheeks
  put(g, 6, 5.4, 'p');
  outline(g);
  return g;
}

function note(): SoftGrid {
  const g = softGrid(ICON, ICON);
  ellipse(g, 3, 6.4, 1.7, 1.3, 'k');
  capsule(g, 4.4, 6.4, 4.4, 0.8, 0.5, 'k'); // stem
  capsule(g, 4.4, 0.8, 6.8, 2.4, 0.6, 'k'); // flag
  capsule(g, 6.8, 2.4, 6.6, 3.8, 0.5, 'k');
  put(g, 2.4, 6, 'w'); // shine on the head
  return g;
}

function hand(): SoftGrid {
  const g = softGrid(ICON, ICON);
  // Three fingers, a gap between each so they read as fingers, a thumb, then the palm.
  for (const [x, top] of [
    [2, 1.5],
    [4, 1],
    [6, 1.5],
  ] as const) {
    capsule(g, x, 4.4, x, top, 0.45, 's');
  }
  capsule(g, 2, 6, 1, 4.6, 0.45, 's'); // thumb
  ellipse(g, 4.2, 5.6, 2.6, 1.8, 's', 'S');
  outline(g);
  return g;
}

function fish(): SoftGrid {
  const g = softGrid(ICON, ICON);
  capsule(g, 5.8, 4.5, 7, 3.2, 0.6, 'f'); // tail
  capsule(g, 5.8, 4.5, 7, 5.8, 0.6, 'f');
  ellipse(g, 3.6, 4.5, 2.6, 1.7, 'f', 'F');
  put(g, 3.6, 2.6, 'F'); // fin
  put(g, 2, 4, 'k'); // eye
  outline(g);
  return g;
}

function heart(): SoftGrid {
  const g = softGrid(ICON, ICON);
  ellipse(g, 2.7, 3, 1.7, 1.6, 'r', 'R');
  ellipse(g, 5.3, 3, 1.7, 1.6, 'r', 'R');
  capsule(g, 1.6, 3.8, 4, 6.6, 1, 'r');
  capsule(g, 6.4, 3.8, 4, 6.6, 1, 'R');
  ellipse(g, 4, 4.4, 2, 1.6, 'r');
  put(g, 2, 2.4, 'w'); // shine
  outline(g);
  return g;
}

function dots(): SoftGrid {
  const g = softGrid(ICON, ICON);
  for (const x of [1, 4, 7]) {
    put(g, x, 4, 'k');
    put(g, x, 5, 'k');
  }
  return g;
}

const ICONS: Readonly<Record<BubbleKind, () => SoftGrid>> = {
  dots,
  smile,
  note,
  wave: hand,
  fish,
  heart,
};

function bubble(kind: BubbleKind): PixelCanvas {
  const canvas = createPixelCanvas(BUBBLE_SPRITE.width, BUBBLE_SPRITE.height);
  balloon(canvas);
  const icon = ICONS[kind]();
  icon.cells.forEach((row, y) => {
    row.forEach((letter, x) => {
      const color = COLORS[letter];
      if (letter !== '.' && color) setPixel(canvas, ICON_AT.x + x, ICON_AT.y + y, color);
    });
  });
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
