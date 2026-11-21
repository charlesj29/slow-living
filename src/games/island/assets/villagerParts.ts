// The villagers: three new characters with their own heads (the half of a
// chibi sprite that gives it its identity), clothes and colours. Their bodies
// keep the explorer's arm and leg geometry, so they plug into the same smooth
// animation (playerFrames.ts). Each character is one pixel per letter:
//   . transparent  o outline  s/S skin/shade  h/H hair/shade  w/W white/shade
//   L/C/c hat light/base/shade  r ribbon or hat band  J/j clothes  b/B straps or
//   sleeves  y buttons  a/A apron  p/P legs  k shoes
import {
  buildCharacterMaps,
  PLAYER_PARTS,
  type CharacterMaps,
  type CharacterParts,
} from './playerFrames';
import { EMPTY_ROW, type Rows } from './playerPixels';

// ── Heads (13 rows: the top ones are free for hats) ─────────────────────────

/** Old farmer: wide straw hat with a red band, grey hair, white beard. */
const FARMER_HEADS = {
  front: [
    EMPTY_ROW,
    '.....oooooo.....',
    '....oLLCCCCo....',
    '....oLCCCCco....',
    '....orrrrrro....',
    '.oLLCCCCCCCCcco.',
    '..oooooooooooo..',
    '...ohssssssho...',
    '...osssssssso...',
    '...osSssssSso...',
    '...osossssoso...',
    '...oWwwSSwwWo...',
    '....owwwwwwo....',
  ],
  back: [
    EMPTY_ROW,
    '.....oooooo.....',
    '....oLLCCCCo....',
    '....oLCCCCco....',
    '....orrrrrro....',
    '.oLLCCCCCCCCcco.',
    '..oooooooooooo..',
    '...ohhhhhhhho...',
    '...ohHhhhhHho...',
    '...ohhhhhhhho...',
    '...oHhhhhhhHo...',
    '....ohhhhhho....',
    '.....oSssSo.....',
  ],
  side: [
    EMPTY_ROW,
    '....oooooo......',
    '...oLLCCCCo.....',
    '...oLCCCCco.....',
    '...orrrrrro.....',
    'oLLCCCCCCCCCcco.',
    '.oooooooooooooo.',
    '...ohhhsssso....',
    '...ohhhsssssso..',
    '...ohhssssssso..',
    '...ohhssossso...',
    '...ohhsWwwwo....',
    '....ohWwwwo.....',
  ],
} as const;

/** Girl: red hair with long braids tied with blue ribbons, rosy cheeks. */
const GIRL_HEADS = {
  front: [
    EMPTY_ROW,
    EMPTY_ROW,
    '.....oooooo.....',
    '...oohhhhhhoo...',
    '..ohhhhhhhhhho..',
    '..ohHhhhhhhHho..',
    '..ohhhhhhhhhho..',
    '..ohhsssssshho..',
    '..ohssssssssho..',
    '..ohssssssssho..',
    '.ohhsossssoshho.',
    '.ohhossSSssohho.',
    '.oro..oSSo..oro.',
  ],
  back: [
    EMPTY_ROW,
    EMPTY_ROW,
    '.....oooooo.....',
    '...oohhhhhhoo...',
    '..ohhhhhhhhhho..',
    '..ohHhhhhhhHho..',
    '..ohhhhhhhhhho..',
    '..ohhhHhhHhhho..',
    '..ohhhhhhhhhho..',
    '..ohHhhhhhhHho..',
    '.ohhhhhhhhhhhho.',
    '.ohhoohhhhoohho.',
    '.oro..oSSo..oro.',
  ],
  side: [
    EMPTY_ROW,
    EMPTY_ROW,
    '....oooooo......',
    '...ohhhhhhoo....',
    '..ohhhhhhhhho...',
    '..ohHhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhhsssso...',
    '..ohhhhssssso...',
    '..ohhhhsssssso..',
    '..ohhhhssossso..',
    '.ohhohhsSsso....',
    '.oro.ohhoSo.....',
  ],
} as const;

/** Baker: tall white chef's hat, round face, a bushy brown moustache. */
const BAKER_HEADS = {
  front: [
    '.....oooooo.....',
    '....owwwwwwo....',
    '...owwwWwwwwo...',
    '...owwwwwWwwo...',
    '...owWwwwwwwo...',
    '...oWWWWWWWWo...',
    '...oooooooooo...',
    '...ohssssssho...',
    '..o' + 'ssssssssss' + 'o..',
    '..osSssssssSso..',
    '..ossossssosso..',
    '..ossssSSsssso..',
    '...oHHHHHHHHo...',
  ],
  back: [
    '.....oooooo.....',
    '....owwwwwwo....',
    '...owwwWwwwwo...',
    '...owwwwwWwwo...',
    '...owWwwwwwwo...',
    '...oWWWWWWWWo...',
    '...oooooooooo...',
    '...ohhhhhhhho...',
    '..ohhhhhhhhhho..',
    '..ohHhhhhhhHho..',
    '..ohhhhhhhhhho..',
    '...ohhhhhhhho...',
    '....oSssssSo....',
  ],
  side: [
    '....oooooo......',
    '...owwwwwwo.....',
    '...owwwWwwwo....',
    '...owwwwwWwo....',
    '...owWwwwwwo....',
    '...oWWWWWWWo....',
    '...ooooooooo....',
    '...ohhhssssso...',
    '..ohhhssssssso..',
    '..ohhSssssssso..',
    '..ohhssssossso..',
    '..ohhsssHHHHo...',
    '...ohhsSSSso....',
  ],
} as const;

// ── Bodies, derived from the explorer's torso shapes ────────────────────────

const COLOURED = /[^.o]/;

/**
 * Removes the explorer's backpack (b/B) from a side-view torso and repairs
 * the outline: stray outline pixels go, and the exposed edge gets one.
 */
function withoutBackpack(rows: Rows): string[] {
  const grid = rows.map((row) => [...row].map((c) => (c === 'b' || c === 'B' ? '.' : c)));
  const at = (x: number, y: number): string => grid[y]?.[x] ?? '.';
  const near = (x: number, y: number, test: (c: string) => boolean): boolean =>
    [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some(test);
  const pruned = grid.map((row, y) =>
    row.map((c, x) => (c === 'o' && !near(x, y, (n) => COLOURED.test(n)) ? '.' : c)),
  );
  const coloured = (c: string | undefined): boolean => c !== undefined && COLOURED.test(c);
  return pruned.map((row) =>
    row
      .map((c, x) => (c === '.' && (coloured(row[x - 1]) || coloured(row[x + 1])) ? 'o' : c))
      .join(''),
  );
}

/** From behind, the explorer's backpack becomes plain clothes (the villagers carry nothing). */
function plainBack(rows: Rows): string[] {
  return rows.map((row) => row.replace(/b/g, 'J').replace(/B/g, 'j'));
}

/** Paints an apron over the middle of a front torso (columns 5–10, below the collar). */
function withApron(rows: Rows): string[] {
  return rows.map((row, y) => {
    if (y === 0) return row;
    return [...row]
      .map((c, x) =>
        x >= 5 && x <= 10 && COLOURED.test(c) ? (y === rows.length - 1 ? 'A' : 'a') : c,
      )
      .join('');
  });
}

type TorsoTriple = CharacterParts['frontTorso'];

const mapTriple = (t: TorsoTriple, f: (rows: Rows) => string[]): TorsoTriple => ({
  stand: f(t.stand),
  swing: f(t.swing),
  pump: f(t.pump),
});

const SIDE_NO_PACK = {
  stand: withoutBackpack(PLAYER_PARTS.sideTorso.stand),
  forward: withoutBackpack(PLAYER_PARTS.sideTorso.forward),
  back: withoutBackpack(PLAYER_PARTS.sideTorso.back),
};

const keep = (rows: Rows): string[] => [...rows];

function character(
  heads: { readonly front: Rows; readonly back: Rows; readonly side: Rows },
  apron: boolean,
): CharacterParts {
  return {
    frontHead: heads.front,
    backHead: heads.back,
    sideHead: heads.side,
    frontTorso: mapTriple(PLAYER_PARTS.frontTorso, apron ? withApron : keep),
    backTorso: mapTriple(PLAYER_PARTS.backTorso, plainBack),
    sideTorso: SIDE_NO_PACK,
  };
}

/** Colours shared by every villager (each palette overrides what it needs). */
const BASE: Readonly<Record<string, string>> = {
  o: '#3a2416',
  s: '#f8c8a0',
  S: '#d89870',
  w: '#f8f8f0',
  W: '#c8c8d4',
  L: '#f4e2a0',
  C: '#dcbc6c',
  c: '#a88a40',
  r: '#b83a2a',
  y: '#f0c840',
  a: '#fbfbf4',
  A: '#d8d8e0',
  k: '#4a3020',
};

export interface VillagerCharacter {
  readonly name: string;
  readonly maps: CharacterMaps;
  readonly palette: Readonly<Record<string, string>>;
}

export const VILLAGER_CHARACTERS: readonly VillagerCharacter[] = [
  {
    name: 'farmer',
    maps: buildCharacterMaps(character(FARMER_HEADS, false)),
    palette: {
      ...BASE,
      h: '#c8c8cc',
      H: '#9a9aa4',
      s: '#f0c09a',
      S: '#cc9070',
      J: '#4c8a3c',
      j: '#2f6228',
      b: '#2f6228',
      B: '#244a1e',
      p: '#4c8a3c',
      P: '#2f6228',
    },
  },
  {
    name: 'girl',
    maps: buildCharacterMaps(character(GIRL_HEADS, true)),
    palette: {
      ...BASE,
      h: '#d4542e',
      H: '#9a3418',
      r: '#5aa0e0',
      b: '#5aa0e0',
      s: '#fad6b8',
      S: '#eca48a',
      J: '#4a78d0',
      j: '#2e52a0',
      B: '#2e52a0',
      y: '#fbfbf4',
      p: '#6a4430',
      P: '#4a2e20',
      k: '#3a2418',
    },
  },
  {
    name: 'baker',
    maps: buildCharacterMaps(character(BAKER_HEADS, true)),
    palette: {
      ...BASE,
      h: '#6a4424',
      H: '#4a2c14',
      J: '#9a6a3c',
      j: '#6c4624',
      b: '#9a6a3c',
      B: '#6c4624',
      y: '#fbfbf4',
      p: '#4c4c5a',
      P: '#34343e',
    },
  },
];
