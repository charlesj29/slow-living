// Ducks on the lake, seen from the side (facing left; mirrored for right):
// a white mother and small yellow ducklings, built from round shapes and
// outlined automatically like the rabbits. Only what floats above the water
// is drawn; a broken line of light ripples along the waterline. The mother
// has two swimming frames (the ripple moves) and two dabbling frames (head
// under, tail up, wiggling); ducklings have the two swimming frames.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';

/** Frame indexes in the mother's strip; ducklings only have `swim`. */
export const DUCK_FRAMES = { swim: [0, 1], dabble: [2, 3], sleep: 4 } as const;
export const DUCK_FRAME_COUNT = 5;
export const DUCKLING_FRAMES = { swim: [0, 1], sleep: 2 } as const;
export const DUCKLING_FRAME_COUNT = 3;
export const DUCK_KEYS = { mother: 'duck_mother', duckling: 'duck_duckling' } as const;

/** Sprite sizes, and the row of the waterline (the ripple row) in each. */
export const DUCK_SPRITE = { width: 16, height: 12, waterline: 9 } as const;
export const DUCKLING_SPRITE = { width: 12, height: 10, waterline: 7 } as const;

/** Body, shade, bill, eye, outline, ripple. */
type Letter = 'w' | 's' | 'b' | 'e' | 'o' | 'r' | '.';

interface Grid {
  readonly width: number;
  readonly height: number;
  readonly cells: Letter[][];
}

const blank = (width: number, height: number): Grid => ({
  width,
  height,
  cells: Array.from({ length: height }, () => Array<Letter>(width).fill('.')),
});

const put = (g: Grid, x: number, y: number, l: Letter): void => {
  const row = g.cells[Math.round(y)];
  const col = Math.round(x);
  if (row && col >= 0 && col < g.width) row[col] = l;
};

/** A filled ellipse; with `shade`, its lower-right part is shaded (light from the top-left). */
function ellipse(
  g: Grid,
  [cx, cy, rx, ry]: readonly [number, number, number, number],
  l: Letter,
  shade = false,
): void {
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny <= 1) put(g, x, y, shade && nx * 0.4 + ny > 0.45 ? 's' : l);
    }
  }
}

/** A rounded stroke (neck, tail). */
function capsule(
  g: Grid,
  [x1, y1, x2, y2]: readonly [number, number, number, number],
  r: number,
  l: Letter,
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2));
      if (Math.hypot(x - (x1 + dx * t), y - (y1 + dy * t)) <= r) put(g, x, y, l);
    }
  }
}

/** Clears everything under the water, outlines what's above, and ripples the waterline. */
function floatOnWater(g: Grid, waterline: number, phase: number): void {
  for (let y = waterline; y < g.height; y++) g.cells[y]?.fill('.');
  const filled = g.cells.map((row) => row.map((l) => l !== '.'));
  for (let y = 0; y < waterline; y++) {
    for (let x = 0; x < g.width; x++) {
      if (filled[y]?.[x]) continue;
      const near = [filled[y - 1]?.[x], filled[y + 1]?.[x], filled[y]?.[x - 1], filled[y]?.[x + 1]];
      if (near.some(Boolean)) put(g, x, y, 'o');
    }
  }
  // The ripple runs along under the body, a little wider, in broken dashes.
  const above = g.cells[waterline - 1] ?? [];
  const left = above.findIndex((l) => l !== '.');
  const right = above.length - 1 - [...above].reverse().findIndex((l) => l !== '.');
  if (left < 0) return;
  for (let x = left - 2; x <= right + 2; x++) {
    if ((x + phase) % 4 !== 3) put(g, x, waterline, 'r');
  }
  // A couple of short wavelets beside it, on the row below.
  for (const x of [left - 3 + phase, right + 2 - phase]) put(g, x, waterline + 1, 'r');
}

function motherSwimming(phase: number): Grid {
  const g = blank(DUCK_SPRITE.width, DUCK_SPRITE.height);
  capsule(g, [12.6, 7, 14.4, 4.8], 1, 'w'); // tail, perked up
  ellipse(g, [8.8, 8.6, 5.6, 3.8], 'w', true); // body
  capsule(g, [8.2, 7, 11.4, 6.4], 0.7, 's'); // folded wing
  capsule(g, [5, 7, 4.6, 4], 1.3, 'w'); // neck
  ellipse(g, [4.3, 3.2, 2.6, 2.5], 'w'); // head
  capsule(g, [1.4, 4, 2.4, 4], 0.6, 'b'); // bill
  put(g, 4, 3, 'e');
  floatOnWater(g, DUCK_SPRITE.waterline, phase);
  return g;
}

function motherDabbling(wiggle: number): Grid {
  const g = blank(DUCK_SPRITE.width, DUCK_SPRITE.height);
  ellipse(g, [8, 8.6, 4.6, 3], 'w', true); // the rear half, tipped up
  ellipse(g, [9 + wiggle * 0.5, 5.6, 2.6, 2.6], 'w', true); // the round rump, tipped up
  capsule(g, [9.6, 4, 10.4 + wiggle, 2.2], 0.8, 'w'); // the tail, wiggling
  ellipse(g, [6.4, 7.4, 1.8, 0.8], 's'); // wing edge
  floatOnWater(g, DUCK_SPRITE.waterline, wiggle > 0 ? 2 : 0);
  return g;
}

/** Asleep: head turned back and tucked onto the back, eyes closed. */
function motherSleeping(): Grid {
  const g = blank(DUCK_SPRITE.width, DUCK_SPRITE.height);
  capsule(g, [12.6, 7.4, 14, 6], 1, 'w'); // tail, settled
  ellipse(g, [8.4, 8.6, 5.8, 3.4], 'w', true); // body, low and round
  ellipse(g, [7.6, 5.6, 2.6, 2.3], 'w'); // head, resting on the back
  capsule(g, [9.4, 5.4, 10.4, 6.2], 0.6, 'b'); // bill tucked into the feathers
  put(g, 6.6, 5.4, 'o'); // a closed eye
  put(g, 7.4, 5.4, 'o');
  floatOnWater(g, DUCK_SPRITE.waterline, 1);
  return g;
}

function ducklingSleeping(): Grid {
  const g = blank(DUCKLING_SPRITE.width, DUCKLING_SPRITE.height);
  ellipse(g, [6.2, 6.8, 3.8, 2.6], 'w'); // body
  ellipse(g, [5, 4.6, 2.1, 1.9], 'w'); // head, nestled down
  put(g, 6.6, 4.8, 'b'); // bill tucked in
  put(g, 4.2, 4.4, 'o'); // a closed eye
  floatOnWater(g, DUCKLING_SPRITE.waterline, 1);
  return g;
}

function duckling(phase: number): Grid {
  const g = blank(DUCKLING_SPRITE.width, DUCKLING_SPRITE.height);
  put(g, 9.8, 5, 'w'); // a tiny tail
  ellipse(g, [6.4, 6.8, 3.6, 2.8], 'w'); // body
  capsule(g, [6.2, 5.6, 7.8, 5.4], 0.5, 's'); // wing nub
  ellipse(g, [3.9, 3.1, 2.2, 2.1], 'w'); // head (big, for a baby)
  put(g, 1.4, 3.6, 'b'); // bill
  put(g, 3.4, 2.6, 'e');
  floatOnWater(g, DUCKLING_SPRITE.waterline, phase);
  return g;
}

type Palette = Readonly<Record<Exclude<Letter, '.'>, Rgba>>;

/** Light glinting on teal lake water. */
const RIPPLE = hexToRgba('#a6e2e4');

const MOTHER: Palette = {
  w: hexToRgba('#fbfaf4'),
  s: hexToRgba('#d6d1c6'),
  b: hexToRgba('#f29a2e'),
  e: hexToRgba('#262028'),
  o: hexToRgba('#4d4a52'),
  r: RIPPLE,
};

const DUCKLING: Palette = {
  w: hexToRgba('#ffe066'),
  s: hexToRgba('#e6b83a'),
  b: hexToRgba('#f08a24'),
  e: hexToRgba('#2a1f14'),
  o: hexToRgba('#7a5a1e'),
  r: RIPPLE,
};

function toCanvas(g: Grid, palette: Palette): PixelCanvas {
  const c = createPixelCanvas(g.width, g.height);
  g.cells.forEach((row, y) => {
    row.forEach((l, x) => {
      if (l !== '.') setPixel(c, x, y, palette[l]);
    });
  });
  return c;
}

export function paintDuckSprites(): SpriteSource[] {
  return [
    {
      key: DUCK_KEYS.mother,
      frames: [
        motherSwimming(0),
        motherSwimming(2),
        motherDabbling(0),
        motherDabbling(1),
        motherSleeping(),
      ].map((g) => toCanvas(g, MOTHER)),
    },
    {
      key: DUCK_KEYS.duckling,
      frames: [duckling(0), duckling(2), ducklingSleeping()].map((g) => toCanvas(g, DUCKLING)),
    },
  ];
}
