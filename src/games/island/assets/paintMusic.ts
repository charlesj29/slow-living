// Music at the evening gathering: a little guitar held across the body (side
// on, facing right; mirrored for left), and small notes that float up from it
// in three soft colours.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';

export const GUITAR_KEY = 'guitar';
/** Where the hands hold it, from the sprite's top-left (map pixels). */
export const GUITAR_GRIP = { x: 4, y: 4 } as const;
export const NOTE_KEYS = ['music_note_0', 'music_note_1', 'music_note_2'] as const;

// prettier-ignore
const GUITAR = [
  '..........hh',
  '.........hh.',
  '........nn..',
  '..obbbonn...',
  '.obBsbbbo...',
  '.obbbbbbo...',
  '..obbbbo....',
  '...oooo.....',
];

const GUITAR_COLORS: Readonly<Record<string, Rgba>> = {
  o: hexToRgba('#5a3420'),
  b: hexToRgba('#d08a44'),
  B: hexToRgba('#f0b26a'),
  s: hexToRgba('#3a2214'),
  n: hexToRgba('#8a5a38'),
  h: hexToRgba('#5a3a24'),
};

// A quaver: a round head, a stem and a little flag.
// prettier-ignore
const NOTE = [
  '..kkk',
  '..k.k',
  '..k..',
  'kkk..',
  'kkk..',
];
const NOTE_COLORS = ['#7a5232', '#e0705a', '#4a9aa8'].map((hex) => hexToRgba(hex));

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

export function paintMusicSprites(): SpriteSource[] {
  return [
    { key: GUITAR_KEY, frames: [fromRows(GUITAR, GUITAR_COLORS)] },
    ...NOTE_KEYS.map((key, i) => ({
      key,
      frames: [fromRows(NOTE, { k: NOTE_COLORS[i] ?? hexToRgba('#7a5232') })],
    })),
  ];
}
