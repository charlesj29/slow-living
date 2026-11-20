// The player character as pixel maps (16×24, feet on the bottom row): an
// explorer with an orange cap and jacket, dark brown hair and a small brown
// backpack. Original design. Each character is one pixel:
//   . transparent  o outline  C/c cap/shade  y yellow trim  h/H hair/shade
//   s/S skin/shade  w white collar  J/j jacket/shade  b/B backpack/strap shade
//   p/P trousers/shade  k shoes
// Upper body (rows 0–17) is per direction; legs (rows 18–23) are per frame.

export const PLAYER_PALETTE: Readonly<Record<string, string>> = {
  o: '#2a1a12',
  C: '#f08a24',
  c: '#b85414',
  y: '#f8d040',
  h: '#5a3418',
  H: '#3a2010',
  s: '#f8c8a0',
  S: '#d89870',
  w: '#f8f8f0',
  J: '#f8a030',
  j: '#c86818',
  b: '#8a5a30',
  B: '#5c3a1c',
  p: '#3a4a7a',
  P: '#28345a',
  k: '#4a3020',
};

export const PLAYER_WIDTH = 16;
export const PLAYER_HEIGHT = 24;

const FRONT_UPPER = [
  '................',
  '.....oooooo.....',
  '....oCCCCCCo....',
  '...oCCCyyCCCo...',
  '...oCCCCCCCCo...',
  '..occccccccccc..',
  '..ohssssssssho..',
  '..ohsossssosho..',
  '..ohsssSSsssho..',
  '...osssssssso...',
  '....ojwwwwjo....',
  '...oJbJwwJbJo...',
  '..oJJbJyyJbJJo..',
  '..ojJbJyyJbJjo..',
  '..ojJJJyyJJJjo..',
  '..osjJJJJJJjso..',
  '...oBBBBBBBBo...',
  '...oppppppppo...',
];

const BACK_UPPER = [
  '................',
  '.....oooooo.....',
  '....oCCCCCCo....',
  '...oCCCCCCCCo...',
  '...ocCCCCCCco...',
  '...occccccccc...',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..oHhhhhhhhhHo..',
  '...oHhhhhhhHo...',
  '....ojjjjjjo....',
  '...oJbbbbbbJo...',
  '..oJbBbbbbBbJo..',
  '..ojbbbbbbbbjo..',
  '..ojbBBBBBBbjo..',
  '..osbbbbbbbbso..',
  '...oBBBBBBBBo...',
  '...oppppppppo...',
];

/** Facing right; facing left is the mirror image. */
const SIDE_UPPER = [
  '................',
  '....oooooo......',
  '...oCCCCCCo.....',
  '...oCCCCyCCo....',
  '...oCCCCCCCo....',
  '..ohhccccccccc..',
  '..ohhhssssso....',
  '..ohhhssosso....',
  '..ohhhsssssso...',
  '...ohhsssSo.....',
  '....ojjwwo......',
  '...obbJJJJo.....',
  '..obBbJJJJJo....',
  '..obbbJjJJJo....',
  '..obBbJjJJJo....',
  '..obbbJsJJJo....',
  '...oBBBBBBo.....',
  '...oppppppo.....',
];

const FRONT_LEGS = {
  stand: [
    '...opppoopppo...',
    '...opppoopppo...',
    '...opppoopppo...',
    '...okkkookkko...',
    '..okkkkookkkko..',
    '...oooo..oooo...',
  ],
  // Left foot down, right foot lifted.
  stepLeft: [
    '...opppoopppo...',
    '...opppoopppo...',
    '...opppookkko...',
    '...okkkooooo....',
    '..okkkko........',
    '...oooo.........',
  ],
  stepRight: [
    '...opppoopppo...',
    '...opppoopppo...',
    '...okkkoopppo...',
    '....oooookkko...',
    '........okkkko..',
    '.........oooo...',
  ],
};

const SIDE_LEGS = {
  stand: [
    '....oppppo......',
    '....oppppo......',
    '....oppppo......',
    '....okkkko......',
    '....okkkkko.....',
    '....ooooooo.....',
  ],
  stepLeft: [
    '....oppppo......',
    '...opppPppo.....',
    '..oppo..oppo....',
    '..okko..okkko...',
    '.okkko..okkkko..',
    '.ooooo..oooooo..',
  ],
  stepRight: [
    '....oppppo......',
    '....oppppo......',
    '....opPppo......',
    '...okkkkko......',
    '...okkkkkko.....',
    '...oooooooo.....',
  ],
};

type LegSet = typeof FRONT_LEGS;

function framesFor(upper: readonly string[], legs: LegSet): readonly (readonly string[])[] {
  return [
    [...upper, ...legs.stand],
    [...upper, ...legs.stepLeft],
    [...upper, ...legs.stepRight],
  ];
}

const mirror = (rows: readonly string[]): string[] =>
  rows.map((row) => [...row].reverse().join(''));

/** Pixel maps per direction: [standing, left step, right step]. */
export const PLAYER_PIXEL_MAPS: Readonly<
  Record<'down' | 'up' | 'left' | 'right', readonly (readonly string[])[]>
> = {
  down: framesFor(FRONT_UPPER, FRONT_LEGS),
  up: framesFor(BACK_UPPER, FRONT_LEGS),
  right: framesFor(SIDE_UPPER, SIDE_LEGS),
  left: framesFor(SIDE_UPPER, SIDE_LEGS).map(mirror),
};
