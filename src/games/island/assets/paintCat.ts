// The cottage cat, curled up asleep by the fire: a round ginger loaf with its
// head tucked in on the left and its tail wrapped round the front, drawn from
// soft shapes with an automatic outline (like the rabbits). The strip is one
// slow loop: two gentle breaths, with a twitch of the tail tip in the second.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';

export const SLEEPING_CAT_KEY = 'cat_sleeping';
/** How full the breath is in each frame (0 out, 2 in); the tail twitches in two frames. */
const BREATHS = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0] as const;
const TWITCH_FRAMES: ReadonlySet<number> = new Set([9, 10]);
export const SLEEPING_CAT_FRAME_COUNT = BREATHS.length;

const SIZE = 16;
/** Coat, light, dark (stripes, shade), cream, closed eye, nose, outline. */
type Letter = 'g' | 'l' | 'd' | 'c' | 'e' | 'n' | 'o' | '.';
type Grid = Letter[][];

const blank = (): Grid => Array.from({ length: SIZE }, () => Array<Letter>(SIZE).fill('.'));
const put = (g: Grid, x: number, y: number, l: Letter): void => {
  const row = g[Math.round(y)];
  if (row && x >= 0 && x < SIZE) row[Math.round(x)] = l;
};

function ellipse(g: Grid, cx: number, cy: number, rx: number, ry: number, l: Letter): void {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      // Shaded along the lower right, lit along the top left.
      put(g, x, y, nx * 0.5 + ny > 0.62 ? 'd' : nx * 0.4 + ny < -0.7 ? 'l' : l);
    }
  }
}

function capsule(g: Grid, x1: number, y1: number, x2: number, y2: number, r: number): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2));
      if (Math.hypot(x - (x1 + dx * t), y - (y1 + dy * t)) <= r) put(g, x, y, 'g');
    }
  }
}

function outline(g: Grid): void {
  const filled = g.map((row) => row.map((l) => l !== '.'));
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (filled[y]?.[x]) continue;
      const near = [filled[y - 1]?.[x], filled[y + 1]?.[x], filled[y]?.[x - 1], filled[y]?.[x + 1]];
      if (near.some(Boolean)) put(g, x, y, 'o');
    }
  }
}

/** Lays an outlined layer over the picture, so each part keeps its own outline. */
function stack(base: Grid, top: Grid): void {
  top.forEach((row, y) => {
    row.forEach((l, x) => {
      if (l !== '.') put(base, x, y, l);
    });
  });
}

function layer(draw: (g: Grid) => void): Grid {
  const g = blank();
  draw(g);
  outline(g);
  return g;
}

function sleepingCat(breath: number, twitch: boolean): Grid {
  const rise = breath * 0.3;
  const g = layer((body) => {
    ellipse(body, 9.6, 11.6 - rise, 5.4, 3.2 + rise, 'g'); // the curled body
    for (const x of [9, 11, 13]) put(body, x, 9.2 - rise, 'd'); // stripes
  });
  // The tail wraps round the front; its tip lifts in a twitch.
  stack(
    g,
    layer((tail) => {
      capsule(tail, 14.2, 13, 11, 14.4, 0.8);
      capsule(tail, 11, 14.4, 7.6, 14.4, 0.8);
      capsule(tail, 7.6, 14.4, twitch ? 6.6 : 6.4, twitch ? 13 : 14.2, 0.8);
    }),
  );
  // The head, facing us, resting on its paws: ears up, eyes shut.
  stack(
    g,
    layer((head) => {
      ellipse(head, 4.5, 11.2, 3.1, 2.6, 'g');
      capsule(head, 2.4, 9.4, 2, 7.8, 0.6); // ears
      capsule(head, 6.6, 9.4, 7, 7.8, 0.6);
      for (const x of [3, 4, 5, 6]) put(head, x, 13, 'c'); // muzzle and chin
      put(head, 4, 12, 'n');
      put(head, 5, 12, 'n');
      // Closed eyes: soft lids (light above, dark lash below) instead of open dots.
      for (const x of [2, 7]) put(head, x, 11, 'e');
      for (const x of [3, 6]) put(head, x, 11, 'e');
      for (const x of [3, 6]) put(head, x, 10, 'l');
    }),
  );
  return g;
}

const COAT: Readonly<Record<Exclude<Letter, '.'>, Rgba>> = {
  g: hexToRgba('#e0893a'),
  l: hexToRgba('#f4ab5c'),
  d: hexToRgba('#b8642a'),
  c: hexToRgba('#fbe3c0'),
  e: hexToRgba('#4a2a18'),
  n: hexToRgba('#e98e8e'),
  o: hexToRgba('#4a2a18'),
};

function toCanvas(g: Grid): PixelCanvas {
  const c = createPixelCanvas(SIZE, SIZE);
  g.forEach((row, y) => {
    row.forEach((l, x) => {
      if (l !== '.') setPixel(c, x, y, COAT[l]);
    });
  });
  return c;
}

export function paintCatSprites(): SpriteSource[] {
  return [
    {
      key: SLEEPING_CAT_KEY,
      frames: BREATHS.map((breath, i) => toCanvas(sleepingCat(breath, TWITCH_FRAMES.has(i)))),
    },
  ];
}
