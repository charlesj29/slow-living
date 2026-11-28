// Little emote bubbles over villagers' (and the kid's and the puppy's) heads,
// in a classic game style: a square cream card with a dark outline, rounded
// corners, a soft shade along the bottom and right, and a small tail pointing
// down at the speaker. The icons are drawn from soft round shapes with their
// own outline and a shine (like the animals): chat dots, a smiley face, a
// musical note, a waving hand, a caught fish and a heart.
//
// Size: a 15×15 card (an odd size, so icons have a true middle) leaves an
// 11×11 icon inside a one-pixel margin: big enough for an outlined, shaded
// icon, and about as wide as a character (16), so it sits over a head without
// crowding it. The tail adds two rows below.
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

const CARD = 15;
const TAIL_ROWS = 2;
export const BUBBLE_SPRITE = { width: CARD, height: CARD + TAIL_ROWS } as const;
/** The icon's size and where it goes on the card (inside the outline and a one-pixel margin). */
const ICON = 11;
const ICON_AT = 2;
/** The tail sits under the card's left third, pointing down at the speaker. */
const TAIL_X = 4;

const COLORS: Readonly<Record<string, Rgba>> = {
  // The card.
  O: hexToRgba('#3a2416'),
  c: hexToRgba('#fff8e6'),
  C: hexToRgba('#ead8b4'),
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
  // Heart and motion marks.
  r: hexToRgba('#e8505a'),
  R: hexToRgba('#b8343e'),
};

/** The card: rounded corners, outline, cream, a shade along the bottom and right, and the tail. */
function card(canvas: PixelCanvas): void {
  const last = CARD - 1;
  const paint = (x: number, y: number, letter: string): void => {
    const color = COLORS[letter];
    if (color) setPixel(canvas, x, y, color);
  };
  for (let y = 0; y < CARD; y++) {
    for (let x = 0; x < CARD; x++) {
      const corner = (x === 0 || x === last) && (y === 0 || y === last);
      if (corner) continue;
      const edge = x === 0 || y === 0 || x === last || y === last;
      const shade = x === last - 1 || y === last - 1;
      paint(x, y, edge ? 'O' : shade ? 'C' : 'c');
    }
  }
  // The tail: an opening in the bottom edge, then a little point.
  paint(TAIL_X, last, 'C');
  paint(TAIL_X + 1, last, 'C');
  paint(TAIL_X - 1, last + 1, 'O');
  paint(TAIL_X, last + 1, 'C');
  paint(TAIL_X + 1, last + 1, 'O');
  paint(TAIL_X, last + 2, 'O');
}

function smile(): SoftGrid {
  const g = softGrid(ICON, ICON);
  ellipse(g, 5, 5, 4.6, 4.6, 'y', 'Y');
  put(g, 2.8, 2.6, 'w'); // shine
  put(g, 3.6, 2, 'w');
  put(g, 3.6, 4.2, 'k'); // eyes
  put(g, 6.6, 4.2, 'k');
  for (const [x, y] of [
    [3, 6],
    [4, 7],
    [5, 7.2],
    [6, 7],
    [7, 6],
  ] as const)
    put(g, x, y, 'k');
  put(g, 2.2, 6, 'p'); // rosy cheeks
  put(g, 8, 6, 'p');
  outline(g);
  return g;
}

function note(): SoftGrid {
  const g = softGrid(ICON, ICON);
  ellipse(g, 3.8, 8, 2.2, 1.6, 'k');
  capsule(g, 5.6, 8, 5.6, 1, 0.55, 'k'); // stem
  capsule(g, 5.6, 1, 8.6, 3.2, 0.7, 'k'); // flag
  capsule(g, 8.6, 3.2, 8.2, 5, 0.6, 'k');
  put(g, 3, 7.4, 'w'); // shine on the head
  return g;
}

function hand(): SoftGrid {
  const g = softGrid(ICON, ICON);
  // Four fingers spread apart (a gap between each, so they read as fingers) and a thumb,
  // then the palm over their roots.
  for (const [x, top] of [
    [1.8, 2.2],
    [4, 0.8],
    [6.2, 0.8],
    [8.4, 2],
  ] as const) {
    capsule(g, x, 5.6, x, top, 0.6, 's');
  }
  capsule(g, 2.2, 8, 0.6, 6.4, 0.7, 's'); // thumb
  ellipse(g, 5.2, 7.6, 3.4, 2.3, 's', 'S');
  outline(g);
  return g;
}

function fish(): SoftGrid {
  const g = softGrid(ICON, ICON);
  capsule(g, 7.6, 5.5, 9.6, 3.6, 0.9, 'f'); // tail
  capsule(g, 7.6, 5.5, 9.6, 7.4, 0.9, 'f');
  ellipse(g, 4.6, 5.5, 3.8, 2.6, 'f', 'F');
  put(g, 4.6, 3.2, 'F'); // fin
  put(g, 2.6, 4.8, 'k'); // eye
  put(g, 3.4, 4.4, 'w'); // shine
  outline(g);
  return g;
}

function heart(): SoftGrid {
  const g = softGrid(ICON, ICON);
  ellipse(g, 3.4, 3.8, 2.6, 2.4, 'r', 'R');
  ellipse(g, 6.8, 3.8, 2.6, 2.4, 'r', 'R');
  capsule(g, 2, 5, 5.1, 8.4, 1.4, 'r');
  capsule(g, 8.2, 5, 5.1, 8.4, 1.4, 'R');
  ellipse(g, 5.1, 5.6, 2.6, 2, 'r');
  put(g, 2.6, 2.8, 'w'); // shine
  put(g, 3.4, 2.4, 'w');
  outline(g);
  return g;
}

function dots(): SoftGrid {
  const g = softGrid(ICON, ICON);
  // Three square dots, two pixels each (the card's shaded right edge balances the extra gap).
  for (const left of [2, 5, 8]) {
    for (const [dx, dy] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ] as const)
      put(g, left + dx, 5 + dy, 'k');
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
  card(canvas);
  const icon = ICONS[kind]();
  icon.cells.forEach((row, y) => {
    row.forEach((letter, x) => {
      const color = COLORS[letter];
      if (letter !== '.' && color) setPixel(canvas, ICON_AT + x, ICON_AT + y, color);
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
