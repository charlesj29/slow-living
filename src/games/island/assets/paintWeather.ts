// Weather sprites: a slanting rain streak, three frames of a raindrop ring
// spreading on the lake, and big soft cloud shadows (translucent, like the
// cast shadows: their keys start with `shadow_`).
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';
import { insideEllipse } from './paint';

export const RAIN_DROP_KEY = 'rain_drop';
export const RAIN_RING_KEYS = ['rain_ring_0', 'rain_ring_1', 'rain_ring_2'] as const;

const DROP = { head: hexToRgba('#ffffff'), tail: hexToRgba('#c8d8ea') } as const;
const RING = hexToRgba('#c4e8f0');
/** Cloud shadows: a faint cool grey, a touch lighter at the rim. */
const CLOUD = { core: hexToRgba('#1c2838', 46), rim: hexToRgba('#1c2838', 28) } as const;

function fromRows(rows: readonly string[], colors: Readonly<Record<string, Rgba>>): PixelCanvas {
  const canvas = createPixelCanvas(rows[0]?.length ?? 0, rows.length);
  rows.forEach((row, y) => {
    [...row].forEach((letter, x) => {
      const color = colors[letter];
      if (color) setPixel(canvas, x, y, color);
    });
  });
  return canvas;
}

/** A streak falling down and a little to the left (the wind blows from the right). */
const DROP_ROWS = ['.h', '.h', '.h', '.t', 't.', 't.', 't.', '..'];

/** A splash, then a ring spreading out (flattened: the lake is seen at an angle). */
const RING_FRAMES: readonly (readonly string[])[] = [
  ['........', '...rr...', '........', '........'],
  ['...rr...', '..r..r..', '...rr...', '........'],
  ['..rrrr..', '.r....r.', '..rrrr..', '........'],
];

/** A cloud's shadow: a few overlapping puffs, one flat shade with a lighter rim. */
function cloudShadow(width: number, height: number, puffs: readonly Puff[]): PixelCanvas {
  const canvas = createPixelCanvas(width, height);
  const RIM_PX = 3;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inside = (grow: number): boolean =>
        puffs.some(([cx, cy, rx, ry]) => insideEllipse(x, y, cx, cy, rx + grow, ry + grow));
      if (inside(0)) setPixel(canvas, x, y, inside(-RIM_PX) ? CLOUD.core : CLOUD.rim);
    }
  }
  return canvas;
}

type Puff = readonly [cx: number, cy: number, rx: number, ry: number];

/** Cloud shapes: size, and the puffs they're made of. */
// prettier-ignore
const CLOUD_SHAPES: readonly { readonly width: number; readonly height: number; readonly puffs: readonly Puff[] }[] = [
  { width: 128, height: 64, puffs: [[40, 34, 30, 20], [70, 26, 30, 22], [96, 36, 26, 18], [62, 44, 36, 16]] },
  { width: 96, height: 48, puffs: [[30, 26, 22, 16], [56, 20, 22, 16], [70, 30, 20, 14]] },
  { width: 160, height: 72, puffs: [[36, 38, 28, 20], [70, 28, 34, 24], [108, 34, 32, 22], [134, 42, 22, 16], [84, 48, 40, 16]] },
];

export const CLOUD_SHADOW_KEYS: readonly string[] = CLOUD_SHAPES.map(
  (_, i) => `shadow_cloud_${String(i)}`,
);

/** Mist banks: wide, low, feathered at the edges (more see-through towards the rim). */
const MIST_SHAPES: readonly {
  readonly width: number;
  readonly height: number;
  readonly puffs: readonly Puff[];
}[] = [
  {
    width: 144,
    height: 48,
    puffs: [
      [40, 26, 34, 14],
      [76, 22, 36, 16],
      [108, 27, 30, 13],
    ],
  },
  {
    width: 112,
    height: 40,
    puffs: [
      [34, 21, 28, 12],
      [70, 19, 32, 13],
    ],
  },
  {
    width: 176,
    height: 52,
    puffs: [
      [44, 28, 36, 15],
      [88, 24, 40, 17],
      [134, 29, 34, 14],
    ],
  },
];
/** Edge to middle: see-through to denser (alpha 0..255). */
const MIST_ALPHAS = [55, 90, 125] as const;
const MIST_RGB = '#eef3f6';

export const MIST_KEYS: readonly string[] = MIST_SHAPES.map((_, i) => `mist_${String(i)}`);

function mistBank(width: number, height: number, puffs: readonly Puff[]): PixelCanvas {
  const canvas = createPixelCanvas(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inside = (shrink: number): boolean =>
        puffs.some(([cx, cy, rx, ry]) =>
          insideEllipse(x, y, cx, cy, rx - shrink, ry - shrink * 0.5),
        );
      // Three bands from the rim inwards, denser towards the middle.
      let band = -1;
      MIST_ALPHAS.forEach((_, i) => {
        if (inside(i * 5)) band = i;
      });
      const alpha = MIST_ALPHAS[band];
      if (alpha !== undefined) setPixel(canvas, x, y, hexToRgba(MIST_RGB, alpha));
    }
  }
  return canvas;
}

/**
 * Drifting leaves, 4×4, in sunny colours that show against the grass (a yellow-green, gold and
 * orange), each seen flat and turned edge-on (pairs: colour × 2 + turn), with a dark edge on
 * the shaded side and a tiny stem.
 */
export const LEAF_KEYS = ['leaf_0', 'leaf_1', 'leaf_2', 'leaf_3', 'leaf_4', 'leaf_5'] as const;
/** How many leaf colours there are (each has a flat and a turned shape). */
export const LEAF_COLOURS = 3;
const LEAF_TINTS: readonly Readonly<Record<string, Rgba>>[] = [
  { g: hexToRgba('#b4dc5c'), G: hexToRgba('#7ca83a'), v: hexToRgba('#e2f4a0') },
  { g: hexToRgba('#f4c64a'), G: hexToRgba('#c88e2e'), v: hexToRgba('#fbe8a8') },
  { g: hexToRgba('#f29848'), G: hexToRgba('#c4622e'), v: hexToRgba('#fdd4a4') },
];
const LEAF_LINE = { o: hexToRgba('#4a4226'), s: hexToRgba('#7a5a30') } as const;
// prettier-ignore
const LEAF_SHAPES: readonly (readonly string[])[] = [
  ['.vg.', 'vgGo', '.Go.', 's...'],
  ['..vo', '.vGo', 'vGo.', 's...'],
];
const LEAF_ROWS: readonly (readonly string[])[] = LEAF_TINTS.flatMap(() => LEAF_SHAPES);
const leafColors = (i: number): Readonly<Record<string, Rgba>> => ({
  ...LEAF_LINE,
  ...(LEAF_TINTS[Math.floor(i / 2)] ?? LEAF_TINTS[0]),
});

/** Puddles after the rain, small to brimming: still water with a darker rim and a sky glint. */
export const PUDDLE_KEYS = ['puddle_0', 'puddle_1', 'puddle_2'] as const;
const PUDDLE_SIZES = [
  { width: 6, height: 3 },
  { width: 10, height: 4 },
  { width: 14, height: 5 },
] as const;
const PUDDLE = {
  water: hexToRgba('#78b8dc'),
  rim: hexToRgba('#4f8ab4'),
  glint: hexToRgba('#d4f0fc'),
} as const;

function puddle(width: number, height: number): PixelCanvas {
  const canvas = createPixelCanvas(width, height);
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const inside = (x: number, y: number): boolean =>
    ((x - cx) / (width / 2)) ** 2 + ((y - cy) / (height / 2)) ** 2 <= 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!inside(x, y)) continue;
      // The rim along the lower edge (where the ground meets it), a glint up on the left.
      const rim = !inside(x, y + 1) || !inside(x + 1, y);
      const glint = y === Math.floor(cy) - (height > 3 ? 1 : 0) && x > cx - width / 3 && x < cx;
      setPixel(canvas, x, y, rim ? PUDDLE.rim : glint ? PUDDLE.glint : PUDDLE.water);
    }
  }
  return canvas;
}

export function paintWeatherSprites(): SpriteSource[] {
  return [
    { key: RAIN_DROP_KEY, frames: [fromRows(DROP_ROWS, { h: DROP.head, t: DROP.tail })] },
    ...RAIN_RING_KEYS.map((key, i) => ({
      key,
      frames: [fromRows(RING_FRAMES[i] ?? [], { r: RING })],
    })),
    ...CLOUD_SHAPES.map((shape, i) => ({
      key: CLOUD_SHADOW_KEYS[i] ?? 'shadow_cloud_0',
      frames: [cloudShadow(shape.width, shape.height, shape.puffs)],
    })),
    ...LEAF_KEYS.map((key, i) => ({ key, frames: [fromRows(LEAF_ROWS[i] ?? [], leafColors(i))] })),
    ...PUDDLE_KEYS.map((key, i) => {
      const size = PUDDLE_SIZES[i] ?? PUDDLE_SIZES[0];
      return { key, frames: [puddle(size.width, size.height)] };
    }),
    ...MIST_SHAPES.map((shape, i) => ({
      key: MIST_KEYS[i] ?? 'mist_0',
      frames: [mistBank(shape.width, shape.height, shape.puffs)],
    })),
  ];
}
