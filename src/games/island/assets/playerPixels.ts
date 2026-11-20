// The player character as pixel maps (16×24, feet on the bottom row), drawn in
// a chunky handheld-RPG style: a big head and cap (about half the height),
// visor overhanging the face, short body, swinging arms. Original design in
// the user's colours: orange cap and jacket, dark brown hair, brown backpack.
// Each character is one pixel:
//   . transparent  o outline  L/C/c cap light/base/shade  v visor  y badge/zip
//   h/H hair/shade  s/S skin/shade  w/W shirt/shade  J/j jacket/shade
//   b/B backpack/shade  p/P trousers/shade  k shoes
// A frame = head (rows 0–12) + torso with arms (rows 13–18) + legs (rows 19–23).

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

type Rows = readonly string[];

const EMPTY_TOP: Rows = ['................', '................', '................'];

const FRONT_HEAD: Rows = [
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

const BACK_HEAD: Rows = [
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
const SIDE_HEAD: Rows = [
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

const FRONT_TORSO = {
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
};

const BACK_TORSO = {
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
};

const SIDE_TORSO = {
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

const FRONT_LEGS = {
  stand: [
    '...oppppppppo...',
    '...opppoopppo...',
    '...oPPpoopPPo...',
    '...okkkookkko...',
    '...oooo..oooo...',
  ],
  // Right foot lifted.
  step: [
    '...oppppppppo...',
    '...opppoopppo...',
    '...oPPpookkko...',
    '...okkkoooooo...',
    '...oooo.........',
  ],
};

const SIDE_LEGS = {
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
  passing: [
    '...oppppppo.....',
    '....oppppo......',
    '....oppppo......',
    '...okkkkko......',
    '...ooooooo......',
  ],
};

const mirror = (rows: Rows): string[] => rows.map((row) => [...row].reverse().join(''));

/** Idle breathing: the head sinks one pixel into the shoulders (the collar row is covered). */
const HEAD_ROWS = 13;
function breathing(frame: Rows): string[] {
  return [EMPTY_TOP[0] ?? '', ...frame.slice(0, HEAD_ROWS), ...frame.slice(HEAD_ROWS + 1)];
}

/** Front and back views are symmetric, so the other step is the mirrored one. */
function symmetricFrames(head: Rows, torso: { stand: Rows; swing: Rows }): Rows[] {
  const stepLeft = [...head, ...torso.swing, ...FRONT_LEGS.step];
  const standing = [...head, ...torso.stand, ...FRONT_LEGS.stand];
  return [standing, stepLeft, mirror(stepLeft), breathing(standing)];
}

const SIDE_STANDING: Rows = [...SIDE_HEAD, ...SIDE_TORSO.stand, ...SIDE_LEGS.stand];
const SIDE_FRAMES: Rows[] = [
  SIDE_STANDING,
  [...SIDE_HEAD, ...SIDE_TORSO.forward, ...SIDE_LEGS.stride],
  [...SIDE_HEAD, ...SIDE_TORSO.back, ...SIDE_LEGS.passing],
  breathing(SIDE_STANDING),
];

/** Pixel maps per direction: [standing, left step, right step, breathing]. */
export const PLAYER_PIXEL_MAPS: Readonly<
  Record<'down' | 'up' | 'left' | 'right', readonly Rows[]>
> = {
  down: symmetricFrames(FRONT_HEAD, FRONT_TORSO),
  up: symmetricFrames(BACK_HEAD, BACK_TORSO),
  right: SIDE_FRAMES,
  left: SIDE_FRAMES.map(mirror),
};
