// Little flying things: butterflies (seen from above, three wing frames: open,
// half and closed) in two colours, and a firefly's glow (bright and dim).
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';

export const BUTTERFLY_FRAMES = { open: 0, half: 1, closed: 2 } as const;
export const BUTTERFLY_FRAME_COUNT = 3;
export const BUTTERFLY_COLORS = ['orange', 'white'] as const;
export type ButterflyColor = (typeof BUTTERFLY_COLORS)[number];
export const butterflyKey = (color: ButterflyColor): string => `butterfly_${color}`;
export const FIREFLY_KEYS = { glow: 'firefly_glow', dim: 'firefly_dim' } as const;

// Wing, wing spot, wing edge, body.
const WING_FRAMES: readonly (readonly string[])[] = [
  ['ww....ww', 'wpw..wpw', 'owwbbwwo', '.owbbwo.', '..wbbw..', '...bb...'],
  ['........', '.ww..ww.', '.wpbbpw.', '..wbbw..', '..obbo..', '...bb...'],
  ['........', '........', '..wbbw..', '..wbbw..', '...bb...', '........'],
];

const WINGS: Readonly<Record<ButterflyColor, Readonly<Record<string, Rgba>>>> = {
  orange: {
    w: hexToRgba('#f28b2a'),
    p: hexToRgba('#ffd66e'),
    o: hexToRgba('#9c4a14'),
    b: hexToRgba('#3a2a20'),
  },
  white: {
    w: hexToRgba('#f6f7ff'),
    p: hexToRgba('#9cc4ff'),
    o: hexToRgba('#7383b3'),
    b: hexToRgba('#3a3a4a'),
  },
};

// A firefly: a bright core in a cross of green-yellow light inside a faint halo,
// or (fading in and out) a smaller, dimmer glow.
const GLOW = ['..h...', '.hgh..', 'hgygh.', '.hgh..', '..h...', '......'];
const DIM = ['......', '..h...', '.hgh..', '..h...', '......', '......'];
const FIREFLY: Readonly<Record<string, Rgba>> = {
  y: hexToRgba('#fffbd6'),
  g: hexToRgba('#cdf25c'),
  h: hexToRgba('#6f9a3a'),
};

function fromRows(rows: readonly string[], colors: Readonly<Record<string, Rgba>>): PixelCanvas {
  const width = rows[0]?.length ?? 0;
  const canvas = createPixelCanvas(width, rows.length);
  rows.forEach((row, y) => {
    [...row].forEach((letter, x) => {
      const color = colors[letter];
      if (color) setPixel(canvas, x, y, color);
    });
  });
  return canvas;
}

export function paintInsectSprites(): SpriteSource[] {
  return [
    ...BUTTERFLY_COLORS.map((color) => ({
      key: butterflyKey(color),
      frames: WING_FRAMES.map((rows) => fromRows(rows, WINGS[color])),
    })),
    { key: FIREFLY_KEYS.glow, frames: [fromRows(GLOW, FIREFLY)] },
    { key: FIREFLY_KEYS.dim, frames: [fromRows(DIM, FIREFLY)] },
  ];
}
