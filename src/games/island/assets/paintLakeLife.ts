// Life on the lake: a chubby little fish leaping out of the water (rising
// nose-up, level at the top, falling nose-down), soft and round like the
// rabbits, and the small V-shaped wake a paddling duck leaves behind it (two
// frames, the arms spreading). Facing left; mirrored for right.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import { hexToRgba, type Rgba } from '@/shared/render/pixelCanvas';
import { capsule, ellipse, outline, put, softCanvas, softGrid, type SoftGrid } from './softShapes';

export const FISH_KEYS = { up: 'fish_up', level: 'fish_level', down: 'fish_down' } as const;
export const WAKE_KEYS = ['duck_wake_0', 'duck_wake_1'] as const;
/** A fish's splash: a crown of foam and droplets bursting up, spreading and falling back. */
export const SPLASH_KEYS = ['fish_splash_0', 'fish_splash_1', 'fish_splash_2'] as const;
/** Then soft double rings spreading over the water, the last one breaking up. */
export const RIPPLE_KEYS = ['fish_ripple_0', 'fish_ripple_1', 'fish_ripple_2'] as const;

const FISH_SIZE = 14;
/** How far a leaping fish tilts its nose up (rising) or down (falling). */
const TILT_RADIANS = 0.6;

/** The fish drawn level, facing left, centred in the grid (no outline yet). */
function levelFish(): SoftGrid {
  const g = softGrid(FISH_SIZE, FISH_SIZE);
  capsule(g, 9.6, 7, 12, 5, 0.9, 'k'); // the tail
  capsule(g, 9.6, 7, 12, 9, 0.9, 'k');
  capsule(g, 6.5, 4.6, 8, 4.4, 0.8, 'k'); // the fin on top
  ellipse(g, 6.5, 7, 4.3, 3, 'w', 's');
  ellipse(g, 6, 8.2, 2.6, 1.4, 'b'); // the belly
  put(g, 4, 6.2, 'e');
  put(g, 4.6, 7.6, 'p'); // a rosy cheek
  return g;
}

/** Turns a grid about its middle (nearest pixel), so a tilted fish keeps hard pixels. */
function rotated(source: SoftGrid, radians: number): SoftGrid {
  const g = softGrid(source.width, source.height);
  const cx = (source.width - 1) / 2;
  const cy = (source.height - 1) / 2;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      const sx = Math.round(cx + (x - cx) * cos + (y - cy) * sin);
      const sy = Math.round(cy - (x - cx) * sin + (y - cy) * cos);
      const letter = source.cells[sy]?.[sx];
      if (letter && letter !== '.') put(g, x, y, letter);
    }
  }
  return g;
}

function fish(tilt: number): SoftGrid {
  const g = rotated(levelFish(), tilt);
  outline(g);
  return g;
}

const FISH_COLORS: Readonly<Record<string, Rgba>> = {
  o: hexToRgba('#6b3422'),
  w: hexToRgba('#f59a52'),
  s: hexToRgba('#d9773a'),
  b: hexToRgba('#ffe7c4'),
  k: hexToRgba('#f8bd78'),
  e: hexToRgba('#2a1a14'),
  p: hexToRgba('#f7a7a0'),
};

// A duck's wake, trailing to the right of a duck facing left: two arms from the tail.
// prettier-ignore
const WAKES: readonly (readonly string[])[] = [
  ['...rrr...', 'rr.......', '...rrr...'],
  ['.....rr.r', 'rrr......', '.....rr.r'],
];
const WAKE_COLORS: Readonly<Record<string, Rgba>> = { r: hexToRgba('#d6eefc') };

// The crown, waterline on the bottom row: w foam, l light water, d droplets.
// prettier-ignore
const SPLASHES: readonly (readonly string[])[] = [
  [
    '.............',
    '.............',
    '.............',
    '......d......',
    '....d...d....',
    '.....wlw.....',
    '....wwlww....',
    '...lwwwwwl...',
    '..l.lllll.l..',
  ],
  [
    '......d......',
    '..d.......d..',
    '.....d.d.....',
    '...d.....d...',
    '....w...w....',
    '....ww.ww....',
    '...lwwlwwl...',
    '..lwlllllwl..',
    '.l.l.....l.l.',
  ],
  [
    '.............',
    '.............',
    '.d.........d.',
    '.............',
    '...d.....d...',
    '.............',
    '.....w.w.....',
    '..l..lll..l..',
    '.l.lw...wl.l.',
  ],
];
const SPLASH_COLORS: Readonly<Record<string, Rgba>> = {
  w: hexToRgba('#ffffff'),
  l: hexToRgba('#d4f0fb'),
  d: hexToRgba('#b4e2f6'),
};

// Rings on the water (flattened: seen at an angle): r the ring, i a fainter ring inside.
// The last one breaks up as it fades.
// prettier-ignore
const RIPPLE_ROWS: readonly (readonly string[])[] = [
  [
    '...rrrrr...',
    '.rr.....rr.',
    'r.........r',
    '.rr.....rr.',
    '...rrrrr...',
  ],
  [
    '.....rrrrrrr.....',
    '..rrr.......rrr..',
    '.r....iiiii....r.',
    'r....i.....i....r',
    '.r....iiiii....r.',
    '..rrr.......rrr..',
    '.....rrrrrrr.....',
  ],
  [
    '.......rr.rrr.rr.......',
    '....rr...........rr....',
    '..r.................r..',
    '.r.......i.i.i.......r.',
    'r.....i.........i.....r',
    '.r.......i.i.i.......r.',
    '..r.................r..',
    '....rr...........rr....',
    '.......rr.rrr.rr.......',
  ],
];
const RIPPLE_COLORS: Readonly<Record<string, Rgba>> = {
  r: hexToRgba('#e4f6fd'),
  i: hexToRgba('#b9e3f5'),
};

function fromRows(rows: readonly string[]): SoftGrid {
  const g = softGrid(rows[0]?.length ?? 0, rows.length);
  rows.forEach((row, y) => [...row].forEach((letter, x) => put(g, x, y, letter)));
  return g;
}

export function paintLakeLifeSprites(): SpriteSource[] {
  return [
    { key: FISH_KEYS.up, frames: [softCanvas(fish(TILT_RADIANS), FISH_COLORS)] },
    { key: FISH_KEYS.level, frames: [softCanvas(fish(0), FISH_COLORS)] },
    { key: FISH_KEYS.down, frames: [softCanvas(fish(-TILT_RADIANS), FISH_COLORS)] },
    ...WAKES.map((rows, i) => ({
      key: WAKE_KEYS[i] ?? `duck_wake_${String(i)}`,
      frames: [softCanvas(fromRows(rows), WAKE_COLORS)],
    })),
    ...SPLASHES.map((rows, i) => ({
      key: SPLASH_KEYS[i] ?? `fish_splash_${String(i)}`,
      frames: [softCanvas(fromRows(rows), SPLASH_COLORS)],
    })),
    ...RIPPLE_ROWS.map((rows, i) => ({
      key: RIPPLE_KEYS[i] ?? `fish_ripple_${String(i)}`,
      frames: [softCanvas(fromRows(rows), RIPPLE_COLORS)],
    })),
  ];
}
