// Wild rabbits, 16×16, built from soft round shapes (a plump body, a round
// head level with it, long ears, a cotton tail) and outlined automatically, so
// every pose stays smooth and chubby. Three views: side (facing left; mirrored
// for right), front (hopping towards the viewer) and back (hopping away). Each
// view has the same eight frames: sit, sit with an ear twitched, two nibble
// frames, and a four-frame hop (crouch, push off, airborne, land) with squash
// and stretch. The renderer adds a small arc to the hop; the shadow stays down.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';

/** Frame indexes in each rabbit strip (the same for every view). */
export const RABBIT_FRAMES = {
  sit: 0,
  twitch: 1,
  nibble: [2, 3],
  hop: [4, 5, 6, 7],
} as const;
export const RABBIT_FRAME_COUNT = 8;
export const RABBIT_VIEWS = ['side', 'front', 'back'] as const;
export type RabbitView = (typeof RABBIT_VIEWS)[number];

const SIZE = 16;
/** Letters on the drawing grid: coat, shade, belly/muzzle, pink, eye, tail, outline. */
type Letter = 'w' | 's' | 'b' | 'p' | 'e' | 't' | 'o' | '.';
type Grid = Letter[][];

const blank = (): Grid => Array.from({ length: SIZE }, () => Array<Letter>(SIZE).fill('.'));
const put = (g: Grid, x: number, y: number, l: Letter): void => {
  const row = g[Math.round(y)];
  if (row && x >= 0 && x < SIZE) row[Math.round(x)] = l;
};

/** A filled ellipse; `shade` picks the shaded part (lower-right, light from the top-left). */
function ellipse(
  g: Grid,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  l: Letter,
  shade = false,
): void {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      put(g, x, y, shade && nx * 0.45 + ny > 0.62 ? 's' : l);
    }
  }
}

/** A rounded stroke from (x1, y1) to (x2, y2) with radius r (ears, legs). */
function capsule(
  g: Grid,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: number,
  l: Letter,
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2));
      if (Math.hypot(x - (x1 + dx * t), y - (y1 + dy * t)) <= r) put(g, x, y, l);
    }
  }
}

/** Every clear pixel touching the rabbit (4-neighbours) becomes outline. */
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

interface Pose {
  readonly body: readonly [cx: number, cy: number, rx: number, ry: number];
  readonly head: readonly [cx: number, cy: number, r: number];
  /** Ears: base and tip of the far (back) ear and the near (front) ear. */
  readonly ears: readonly [
    readonly [number, number, number, number],
    readonly [number, number, number, number],
  ];
  /** Legs as strokes (front paws, hind legs), drawn under the body. */
  readonly legs?: readonly (readonly [number, number, number, number])[];
}

/** Side view, facing left. */
const SIDE: readonly Pose[] = [
  // sit
  {
    body: [9.5, 11, 5.2, 4.2],
    head: [5, 9, 3.2],
    ears: [
      [6.5, 6, 8, 1.6],
      [5, 6, 5, 1.4],
    ],
    legs: [[4.5, 13, 4, 15]],
  },
  // twitch: the far ear tips back
  {
    body: [9.5, 11, 5.2, 4.2],
    head: [5, 9, 3.2],
    ears: [
      [6.5, 6, 10, 3.2],
      [5, 6, 5, 1.4],
    ],
    legs: [[4.5, 13, 4, 15]],
  },
  // nibble: head down to the grass, ears back along the neck
  {
    body: [9.8, 10.5, 5.2, 4.4],
    head: [4.2, 11.6, 3],
    ears: [
      [6, 9.5, 9, 6.5],
      [5, 9.5, 7.5, 6],
    ],
    legs: [[5, 13.5, 5, 15]],
  },
  {
    body: [9.8, 10.7, 5.2, 4.3],
    head: [4, 12, 3],
    ears: [
      [6, 10, 9.2, 7],
      [5, 10, 7.8, 6.6],
    ],
    legs: [[5, 13.5, 5, 15]],
  },
  // hop: crouch (squashed, ears laid back)
  {
    body: [9.5, 12, 5.8, 3.5],
    head: [4.6, 10.6, 3],
    ears: [
      [6.5, 8.5, 10.5, 7.5],
      [5.5, 8.5, 9.5, 7],
    ],
    legs: [[5, 14, 4.5, 15]],
  },
  // push off: stretched forward, hind leg pushing back
  {
    body: [8.8, 10.8, 6.2, 3.4],
    head: [3.8, 9, 3],
    ears: [
      [5.5, 7, 10, 5.4],
      [4.5, 7, 9, 5],
    ],
    legs: [
      [12.5, 12.5, 14.6, 14.6],
      [3.5, 12, 2.5, 13.5],
    ],
  },
  // airborne: long and level, paws forward, legs back
  {
    body: [8.5, 9.6, 6.2, 3.2],
    head: [3.6, 8.2, 3],
    ears: [
      [5.5, 6, 10, 4.8],
      [4.5, 6, 9, 4.4],
    ],
    legs: [
      [3, 11, 1.5, 12.5],
      [13, 11, 15, 11.8],
    ],
  },
  // land: front paws down, rump up
  {
    body: [9.4, 10.4, 5.6, 3.6],
    head: [4.2, 10.6, 3],
    ears: [
      [5.8, 8, 10, 6.4],
      [4.8, 8, 9, 6],
    ],
    legs: [
      [4.5, 12.5, 4.5, 15],
      [13, 11.5, 14, 12.5],
    ],
  },
];

/**
 * Front view (facing the viewer), symmetric round x 7.5: a round body under a
 * smaller head (a little neck shows between them) and ears that splay outward.
 */
// prettier-ignore
const FRONT: readonly Pose[] = [
  { body: [7.5, 11.4, 5.3, 3.8], head: [7.5, 6.8, 3], ears: [[6.2, 4.5, 4.6, 0.6], [8.8, 4.5, 10.4, 0.6]] },
  { body: [7.5, 11.4, 5.3, 3.8], head: [7.5, 6.8, 3], ears: [[6.2, 4.5, 4.6, 0.6], [8.8, 4.5, 12, 2.2]] },
  { body: [7.5, 11, 5.3, 4], head: [7.5, 10.2, 3], ears: [[6.2, 8, 4.4, 5.2], [8.8, 8, 10.6, 5.2]] },
  { body: [7.5, 11, 5.3, 4], head: [7.5, 10.6, 3], ears: [[6.2, 8.4, 4.4, 5.6], [8.8, 8.4, 10.6, 5.6]] },
  { body: [7.5, 12.2, 5.8, 3.3], head: [7.5, 8.8, 3], ears: [[6.2, 6.5, 3.2, 5], [8.8, 6.5, 11.8, 5]] },
  { body: [7.5, 10.9, 4.8, 4.2], head: [7.5, 6.4, 3], ears: [[6.3, 4, 5, 0.4], [8.7, 4, 10, 0.4]] },
  { body: [7.5, 9.8, 5, 3.9], head: [7.5, 5.8, 3], ears: [[6.3, 3.6, 4.2, 0.4], [8.7, 3.6, 10.8, 0.4]] },
  { body: [7.5, 11.8, 5.8, 3.5], head: [7.5, 8.2, 3], ears: [[6.2, 6, 3.8, 2.6], [8.8, 6, 11.2, 2.6]] },
];

/** Back view (hopping away): the same shapes as the front, seen from behind. */
const BACK: readonly Pose[] = FRONT;

function drawSide(pose: Pose): Grid {
  const g = blank();
  const [bx, by, brx, bry] = pose.body;
  const [hx, hy, hr] = pose.head;
  const [far, near] = pose.ears;
  for (const leg of pose.legs ?? []) capsule(g, leg[0], leg[1], leg[2], leg[3], 0.9, 'b');
  capsule(g, far[0], far[1], far[2], far[3], 1, 'w');
  ellipse(g, bx, by, brx, bry, 'w', true);
  ellipse(g, bx + brx - 0.6, by - 0.8, 1.6, 1.6, 't'); // the cotton tail
  ellipse(g, hx, hy, hr, hr, 'w');
  capsule(g, near[0], near[1], near[2], near[3], 1, 'w');
  capsule(g, near[0], near[1] - 0.6, near[2], near[3] + 0.6, 0.35, 'p');
  ellipse(g, hx - hr + 1.4, hy + 0.9, 1.3, 1, 'b'); // muzzle
  put(g, hx - hr + 0.4, hy + 0.4, 'p'); // nose
  put(g, hx - 0.8, hy - 0.6, 'e'); // eye
  outline(g);
  return g;
}

function drawFrontOrBack(pose: Pose, front: boolean): Grid {
  const g = blank();
  const [bx, by, brx, bry] = pose.body;
  const [hx, hy, hr] = pose.head;
  for (const [x1, y1, x2, y2] of pose.ears) {
    capsule(g, x1, y1, x2, y2, 1, 'w');
    if (front) capsule(g, x1, y1 - 0.4, x2, y2 + 0.6, 0.35, 'p');
  }
  ellipse(g, bx, by, brx, bry, 'w', true);
  // Feet peeking out at the bottom.
  ellipse(g, bx - 2.6, by + bry - 0.6, 1.4, 0.9, 'b');
  ellipse(g, bx + 2.6, by + bry - 0.6, 1.4, 0.9, 'b');
  if (front)
    ellipse(g, bx, by + 1, brx * 0.5, bry * 0.55, 'b'); // belly
  else ellipse(g, bx, by + bry * 0.45, 1.7, 1.6, 't'); // the tail, seen from behind
  ellipse(g, hx, hy, hr, hr, 'w');
  if (front) {
    ellipse(g, hx, hy + 1.3, 1.6, 1.1, 'b');
    put(g, hx - 1.4, hy - 0.4, 'e');
    put(g, hx + 1.4, hy - 0.4, 'e');
    put(g, hx, hy + 0.8, 'p');
  }
  outline(g);
  return g;
}

type Coat = Readonly<Record<Exclude<Letter, '.'>, Rgba>>;

const COATS: Readonly<Record<'white' | 'brown', Coat>> = {
  white: {
    o: hexToRgba('#5c4b4f'),
    w: hexToRgba('#fbf8f3'),
    s: hexToRgba('#ddd4cc'),
    b: hexToRgba('#fff6ee'),
    p: hexToRgba('#f3a3b3'),
    e: hexToRgba('#2b2026'),
    t: hexToRgba('#ffffff'),
  },
  brown: {
    o: hexToRgba('#3b2418'),
    w: hexToRgba('#b07a4c'),
    s: hexToRgba('#8a5c3a'),
    b: hexToRgba('#efdcbe'),
    p: hexToRgba('#e09aa3'),
    e: hexToRgba('#1f140e'),
    t: hexToRgba('#f6efe4'),
  },
};

function toCanvas(g: Grid, coat: Coat): PixelCanvas {
  const c = createPixelCanvas(SIZE, SIZE);
  g.forEach((row, y) => {
    row.forEach((l, x) => {
      if (l !== '.') setPixel(c, x, y, coat[l]);
    });
  });
  return c;
}

/** Atlas key of a rabbit strip. */
export const rabbitKey = (coat: 'white' | 'brown', view: RabbitView): string =>
  `rabbit_${coat}_${view}`;

export function paintRabbitSprites(): SpriteSource[] {
  return (['white', 'brown'] as const).flatMap((coat) => [
    {
      key: rabbitKey(coat, 'side'),
      frames: SIDE.map((pose) => toCanvas(drawSide(pose), COATS[coat])),
    },
    {
      key: rabbitKey(coat, 'front'),
      frames: FRONT.map((pose) => toCanvas(drawFrontOrBack(pose, true), COATS[coat])),
    },
    {
      key: rabbitKey(coat, 'back'),
      frames: BACK.map((pose) => toCanvas(drawFrontOrBack(pose, false), COATS[coat])),
    },
  ]);
}
