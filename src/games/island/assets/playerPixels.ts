// The player character's body parts as pixel maps (16 px wide), drawn in a
// chunky handheld-RPG style: a big head and cap (about half the height), visor
// overhanging the face, short body, swinging arms. Original design in the
// user's colours: orange cap and jacket, dark brown hair, brown backpack.
// `playerFrames.ts` assembles the parts into 16×24 animation frames.
// Each character is one pixel:
//   . transparent  o outline  L/C/c cap light/base/shade  v visor  y badge/zip
//   h/H hair/shade  s/S skin/shade  w/W shirt/shade  J/j jacket/shade
//   b/B backpack/shade  p/P trousers/shade  k shoes
// Parts: head (13 rows, the first 3 empty headroom) + torso with arms (6 rows)
// + legs (5 rows) = 24 rows.

export const PLAYER_PALETTE: Readonly<Record<string, string>> = {
  o: '#3a2416',
  L: '#ffc070',
  C: '#f08a24',
  c: '#b85414',
  v: '#c85a10',
  y: '#f8d040',
  h: '#5a3418',
  H: '#3a2010',
  s: '#f8c8a0',
  S: '#d89870',
  w: '#f8f8f0',
  W: '#c8c8d4',
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

export type Rows = readonly string[];

export const EMPTY_ROW = '................';
const EMPTY_TOP: Rows = [EMPTY_ROW, EMPTY_ROW, EMPTY_ROW];

export const FRONT_HEAD: Rows = [
  ...EMPTY_TOP,
  '.....oooooo.....',
  '...ooLLCCCCoo...',
  '..oLLCCCCCCCCo..',
  '..oLCCCyyCCCCo..',
  '..oCCCCCCCCCco..',
  '.ovvvvvvvvvvvvo.',
  '..ohssssssssho..',
  '..ohsossssosho..',
  '..ohsossssosho..',
  '...osssSSssso...',
];

export const BACK_HEAD: Rows = [
  ...EMPTY_TOP,
  '.....oooooo.....',
  '...ooLLCCCCoo...',
  '..oLLCCCCCCCCo..',
  '..oLCCCCCCCCco..',
  '..oCCCCCCCCCco..',
  '..occccoocccco..',
  '..ohhhhhhhhhho..',
  '..oHhhhhhhhhHo..',
  '...oHhhhhhhHo...',
  '....oSssssSo....',
];

/** Facing right (the visor juts forward); facing left is the mirror image. */
export const SIDE_HEAD: Rows = [
  ...EMPTY_TOP,
  '....oooooo......',
  '...oLLCCCCoo....',
  '..oLCCCCCCCCo...',
  '..oCCCCCCCyCo...',
  '..occCCCCCCCCoo.',
  '..ohccvvvvvvvvvo',
  '..ohhhsssssoo...',
  '..ohhhsssosso...',
  '..ohhhsssossso..',
  '...ohhssSSso....',
];

/** Head row of the upper eye pixels; blinking paints them as skin, leaving a closed-eye line. */
export const EYE_ROW = 10;

export const FRONT_TORSO = {
  stand: [
    '....ojJwwJjo....',
    '..oJbJJyyJJbJo..',
    '.ojJbJJyyJJbJjo.',
    '.ojJbJJyyJJbJjo.',
    '.osjJJJyyJJJjso.',
    '..ojjjjjjjjjjo..',
  ],
  // Right hand swings forward (up), left hand back.
  swing: [
    '....ojJwwJjo....',
    '..oJbJJyyJJbJo..',
    '.ojJbJJyyJJbJjo.',
    '.ojJbJJyyJJbJso.',
    '.osjJJJyyJJJjo..',
    '..ojjjjjjjjjjo..',
  ],
  // Running: the arms pump further, right hand high, left hand low.
  pump: [
    '....ojJwwJjo....',
    '..oJbJJyyJJbJo..',
    '.ojJbJJyyJJbJso.',
    '.ojJbJJyyJJbJo..',
    '.ojjJJJyyJJJjo..',
    '.osjjjjjjjjjjo..',
  ],
};

export const BACK_TORSO = {
  stand: [
    '....ojjjjjjo....',
    '..oJbbbbbbbbJo..',
    '.ojbBbbbbbbBbjo.',
    '.ojbbbbbbbbbbjo.',
    '.osbBBBBBBBBbso.',
    '..ojjjjjjjjjjo..',
  ],
  swing: [
    '....ojjjjjjo....',
    '..oJbbbbbbbbJo..',
    '.ojbBbbbbbbBbjo.',
    '.ojbbbbbbbbbbso.',
    '.osbBBBBBBBBbo..',
    '..ojjjjjjjjjjo..',
  ],
  pump: [
    '....ojjjjjjo....',
    '..oJbbbbbbbbJo..',
    '.ojbBbbbbbbBbso.',
    '.ojbbbbbbbbbbo..',
    '.ojbBBBBBBBBbo..',
    '.osjjjjjjjjjjo..',
  ],
};

export const SIDE_TORSO = {
  stand: [
    '....oojjwo......',
    '...obbJJJJo.....',
    '..obBbJojJJo....',
    '..obbbJojJJo....',
    '..obBbJosJJo....',
    '...objjjjjjo....',
  ],
  forward: [
    '....oojjwo......',
    '...obbJJJJo.....',
    '..obBbJJojJo....',
    '..obbbJJJoso....',
    '..obBbJJJJJo....',
    '...objjjjjjo....',
  ],
  back: [
    '....oojjwo......',
    '...obbJJJJo.....',
    '..obBbojJJJo....',
    '..obbosJJJJo....',
    '..obBbJJJJJo....',
    '...objjjjjjo....',
  ],
};

/** Front and back views share legs; steps lift the right foot (mirrored for the left). */
export const FRONT_LEGS = {
  stand: [
    '...oppppppppo...',
    '...opppoopppo...',
    '...oPPpoopPPo...',
    '...okkkookkko...',
    '...oooo..oooo...',
  ],
  step: [
    '...oppppppppo...',
    '...opppoopppo...',
    '...oPPpookkko...',
    '...okkkoooooo...',
    '...oooo.........',
  ],
  // The knee comes up: the foot is two rows off the ground.
  stepHigh: [
    '...oppppppppo...',
    '...opppookkko...',
    '...oPPpoooooo...',
    '...okkko........',
    '...oooo.........',
  ],
};

/** Side view, facing right. */
export const SIDE_LEGS = {
  stand: [
    '...oppppppo.....',
    '....oppppo......',
    '....oPPPpo......',
    '....okkkkko.....',
    '....ooooooo.....',
  ],
  stride: [
    '...oppppppo.....',
    '..opppoopppo....',
    '..oPpo..oPpo....',
    '..okkko.okkkko..',
    '..ooooo.oooooo..',
  ],
  // The same stride with the other leg in front (the near leg is the lighter one).
  strideOther: [
    '...oppppppo.....',
    '..opppoopPPo....',
    '..oppo..oPPo....',
    '..okkko.okkkko..',
    '..ooooo.oooooo..',
  ],
  passing: [
    '...oppppppo.....',
    '....oppppo......',
    '....oppppo......',
    '...okkkkko......',
    '...ooooooo......',
  ],
  runStride: [
    '...oppppppo.....',
    '..opppo.opppo...',
    '.oPpo....oppo...',
    '.okko....okkkko.',
    '.oooo....oooooo.',
  ],
  // Both feet off the ground: back foot tucked up behind, front leg reaching.
  runAir: [
    '...oppppppo.....',
    '...opppPPppo....',
    '..okkko.oppo....',
    '..ooooo.okkko...',
    '........ooooo...',
  ],
};
