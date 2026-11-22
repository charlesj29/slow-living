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
  ];
}
