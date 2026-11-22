// Chimney smoke: three puffs of growing size (hard-edged pixel clouds, lit on
// the top-left), shown one after another as a puff rises and spreads.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { fillEllipse } from './paint';

const SMOKE = {
  shade: hexToRgba('#b9b6b0'),
  base: hexToRgba('#d6d3cc'),
  light: hexToRgba('#efece6'),
} as const;

/** Puff sizes, smallest (just out of the chimney) first. */
const PUFF_SIZES = [5, 7, 9] as const;

export const SMOKE_KEYS = PUFF_SIZES.map((_, i) => `smoke_${String(i)}`);

function puff(size: number): PixelCanvas {
  const c = createPixelCanvas(size, size);
  const r = (size - 1) / 2;
  fillEllipse(c, r, r, r, r, SMOKE.shade);
  fillEllipse(c, r - 0.5, r - 0.5, r - 0.8, r - 0.8, SMOKE.base);
  fillEllipse(c, r - 1.2, r - 1.2, Math.max(0.6, r - 2.2), Math.max(0.6, r - 2.2), SMOKE.light);
  return c;
}

/** Steam from fresh bread: two thin curls, swapped as a wisp rises. */
export const STEAM_KEYS = ['steam_0', 'steam_1'] as const;
const STEAM = { w: hexToRgba('#ffffff'), l: hexToRgba('#dfe6ea') } as const;
// prettier-ignore
const STEAM_ROWS = [
  ['.w.', 'w..', 'l..', '.w.', '..l', '...'],
  ['.w.', '..w', '..l', '.w.', 'l..', '...'],
];

function wisp(rows: readonly string[]): PixelCanvas {
  const c = createPixelCanvas(rows[0]?.length ?? 0, rows.length);
  rows.forEach((row, y) => {
    [...row].forEach((letter, x) => {
      if (letter === 'w') setPixel(c, x, y, STEAM.w);
      if (letter === 'l') setPixel(c, x, y, STEAM.l);
    });
  });
  return c;
}

export function paintSmokeSprites(): SpriteSource[] {
  return [
    ...PUFF_SIZES.map((size, i) => ({ key: SMOKE_KEYS[i] ?? 'smoke_0', frames: [puff(size)] })),
    ...STEAM_KEYS.map((key, i) => ({ key, frames: [wisp(STEAM_ROWS[i] ?? [])] })),
  ];
}
