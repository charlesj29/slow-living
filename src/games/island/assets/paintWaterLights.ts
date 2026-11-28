// Light on the water: a reflected star (bright and dim), the moon's
// reflection broken up by ripples (two shimmering frames), a golden sparkle of
// the low sun (bright and dim) and a shooting star's streak. All are drawn
// untinted, so they glow against the dark (or golden) water.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';

export const WATER_LIGHT_KEYS = {
  starBright: 'water_star_bright',
  starDim: 'water_star_dim',
  moonA: 'water_moon_a',
  moonB: 'water_moon_b',
  glintBright: 'water_glint_bright',
  glintDim: 'water_glint_dim',
  shootingStar: 'water_shooting_star',
} as const;

const STAR_BRIGHT = ['.s.', 'sws', '.s.'];
const STAR_DIM = ['...', '.s.', '...'];

// The moon on rippling water: short bright dashes, longer near the middle,
// that shift between the two frames.
const MOON_A = [
  '....wwww....',
  '...wWWWWw...',
  '..wWWWWWWw..',
  '..wWWWWWWw..',
  '...wWWWWw...',
  '....wwww....',
  '............',
  '..mmwwww....',
  '.....wwwmmm.',
  '............',
  '...mmwww....',
  '......wwm...',
  '............',
  '....mww.....',
  '......wm....',
  '............',
  '.....m......',
];
const MOON_B = [
  '....wwww....',
  '...wWWWWw...',
  '..wWWWWWWw..',
  '..wWWWWWWw..',
  '...wWWWWw...',
  '....wwww....',
  '............',
  '....wwwwmm..',
  '.mmmwww.....',
  '............',
  '....wwwmm...',
  '...mww......',
  '............',
  '.....wwm....',
  '....mw......',
  '............',
  '......m.....',
];

const GLINT_BRIGHT = ['..g..', '..y..', 'gyWyg', '..y..', '..g..'];
const GLINT_DIM = ['.....', '..g..', '.gyg.', '..g..', '.....'];

// Falling down to the right: a bright head and a fading tail behind it.
const SHOOTING_STAR = [
  'f...........',
  '.ff.........',
  '...tt.......',
  '.....ts.....',
  '.......sw...',
  '.........wW.',
];

const COLORS: Readonly<Record<string, Rgba>> = {
  W: hexToRgba('#ffffff'),
  w: hexToRgba('#f4f1d8'),
  s: hexToRgba('#9fb3e8'),
  m: hexToRgba('#d8cf9a'),
  t: hexToRgba('#7d90c8'),
  f: hexToRgba('#4f5f96'),
  y: hexToRgba('#ffe08a'),
  g: hexToRgba('#e8a648'),
};

function fromRows(rows: readonly string[]): PixelCanvas {
  const width = rows[0]?.length ?? 0;
  const canvas = createPixelCanvas(width, rows.length);
  rows.forEach((row, y) => {
    [...row].forEach((letter, x) => {
      const color = COLORS[letter];
      if (color) setPixel(canvas, x, y, color);
    });
  });
  return canvas;
}

export function paintWaterLightSprites(): SpriteSource[] {
  return [
    { key: WATER_LIGHT_KEYS.starBright, frames: [fromRows(STAR_BRIGHT)] },
    { key: WATER_LIGHT_KEYS.starDim, frames: [fromRows(STAR_DIM)] },
    { key: WATER_LIGHT_KEYS.moonA, frames: [fromRows(MOON_A)] },
    { key: WATER_LIGHT_KEYS.moonB, frames: [fromRows(MOON_B)] },
    { key: WATER_LIGHT_KEYS.glintBright, frames: [fromRows(GLINT_BRIGHT)] },
    { key: WATER_LIGHT_KEYS.glintDim, frames: [fromRows(GLINT_DIM)] },
    { key: WATER_LIGHT_KEYS.shootingStar, frames: [fromRows(SHOOTING_STAR)] },
  ];
}
