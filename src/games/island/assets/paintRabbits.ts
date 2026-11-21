// Wild rabbits, 16×16, facing left (mirrored to face right), drawn pixel by
// pixel: sitting (and the same with one ear twitched back), nibbling (two
// frames), and a four-frame hop — crouch with the ears laid back, push off
// with the hind legs stretched, airborne fully stretched out, land on the front
// paws. The renderer adds a small arc to the hop while the shadow stays down.
// Two coats: white with pink ears, and brown with a cream muzzle and tail.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';

/** Frame indexes in each rabbit strip. */
export const RABBIT_FRAMES = {
  sit: 0,
  twitch: 1,
  nibble: [2, 3],
  hop: [4, 5, 6, 7],
} as const;
export const RABBIT_FRAME_COUNT = 8;

// Letters: o outline, w coat, s coat shade, p pink (ears, nose), e eye,
// b muzzle and paws, t tail; '.' is clear.
// prettier-ignore
const FRAMES: readonly (readonly string[])[] = [
  [ // sit
    '................',
    '...o..o.........',
    '..opo.opo.......',
    '..opo.opo.......',
    '..owo.owo.......',
    '..owoowwo.......',
    '.owwwwwwo.......',
    'owewwwwwwo......',
    'owwwwwwwwwoo....',
    'opbwwwwwwwwwo...',
    '.obbwwwwwwwwwoo.',
    '..owwwwwwwwwwtto',
    '..owwwwwwwwwwtto',
    '..owswwwwwwwsso.',
    '..obwoowwwwssso.',
    '...oo..ooooooo..',
  ],
  [ // sit, the back ear twitched back
    '................',
    '...o............',
    '..opo...oo......',
    '..opo..opo......',
    '..owo.owo.......',
    '..owoowwo.......',
    '.owwwwwwo.......',
    'owewwwwwwo......',
    'owwwwwwwwwoo....',
    'opbwwwwwwwwwo...',
    '.obbwwwwwwwwwoo.',
    '..owwwwwwwwwwtto',
    '..owwwwwwwwwwtto',
    '..owswwwwwwwsso.',
    '..obwoowwwwssso.',
    '...oo..ooooooo..',
  ],
  [ // nibble: head down, ears back along the neck
    '................',
    '................',
    '................',
    '................',
    '........oooo....',
    '.......owwwwoo..',
    '......owwwwwwwo.',
    '..oo.owwwwwwwwto',
    '.opwoowwwwwwwwto',
    '.opwwowwwwwwwwso',
    '..oowwwwwwwwwwso',
    '.owwwwwwwwwwwsso',
    'owewwwwwwwwwssso',
    'opbwwoowwwwssso.',
    'obbwo..owwssso..',
    '.ooo....oooooo..',
  ],
  [ // nibble: chewing
    '................',
    '................',
    '................',
    '................',
    '........oooo....',
    '.......owwwwoo..',
    '......owwwwwwwo.',
    '.oo..owwwwwwwwto',
    'opwooowwwwwwwwto',
    'opwwwowwwwwwwwso',
    '.oowwwwwwwwwwwso',
    '.owwwwwwwwwwwsso',
    'owewwwwwwwwwssso',
    'obpwwoowwwwssso.',
    'obbwo..owwssso..',
    '.ooo....oooooo..',
  ],
  [ // hop 1: crouch, ears laid back
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '....ooooo.......',
    '...opppwwoo.....',
    '..owwwwwwwwoo...',
    '.owewwwwwwwwwo..',
    'opbwwwwwwwwwwwo.',
    'obbwwwwwwwwwwtto',
    '.owwwwwwwwwwwtto',
    '..owswwwwwwwsso.',
    '..obwoowwwwssso.',
    '...oo..ooooooo..',
  ],
  [ // hop 2: push off, hind legs stretched
    '................',
    '................',
    '................',
    '................',
    '....oooo........',
    '...opppwoo......',
    '..owwwwwwwoo....',
    '.owewwwwwwwwoo..',
    'opbwwwwwwwwwwwoo',
    'obbwwwwwwwwwwtto',
    '.oowwwwwwwwwwtto',
    '..obo.owwwwwssso',
    '..oo...owwwsssso',
    '.........owssso.',
    '..........owsso.',
    '...........ooo..',
  ],
  [ // hop 3: airborne, stretched out
    '................',
    '................',
    '................',
    '....oooo........',
    '...opppwoo......',
    '..owwwwwwwoo....',
    '.owewwwwwwwwoo..',
    'opbwwwwwwwwwwwoo',
    'obbwwwwwwwwwwtto',
    '.oowwwwwwwwwwtto',
    'oboo.owwwwwwssoo',
    'oo....oowwssoso.',
    '.........oooo.o.',
    '................',
    '................',
    '................',
  ],
  [ // hop 4: land on the front paws
    '................',
    '................',
    '................',
    '................',
    '................',
    '......oooo......',
    '.....opppwoo....',
    '....owwwwwwwoo..',
    '...owewwwwwwwwoo',
    '..opbwwwwwwwwtto',
    '..obbwwwwwwwwtto',
    '...owwwwwwwwssso',
    '...owwwwwwwssso.',
    '...obwo.owwsso..',
    '...obwo..oooo...',
    '...ooo..........',
  ],
];

type Coat = Readonly<Record<'o' | 'w' | 's' | 'p' | 'e' | 'b' | 't', Rgba>>;

const COATS: Readonly<Record<'white' | 'brown', Coat>> = {
  white: {
    o: hexToRgba('#5c4b4f'),
    w: hexToRgba('#fbf8f3'),
    s: hexToRgba('#dcd3cb'),
    p: hexToRgba('#f3a3b3'),
    e: hexToRgba('#2b2026'),
    b: hexToRgba('#fbf8f3'),
    t: hexToRgba('#ffffff'),
  },
  brown: {
    o: hexToRgba('#3b2418'),
    w: hexToRgba('#b07a4c'),
    s: hexToRgba('#83573a'),
    p: hexToRgba('#e09aa3'),
    e: hexToRgba('#1f140e'),
    b: hexToRgba('#efdcbe'),
    t: hexToRgba('#f6efe4'),
  },
};

const SIZE = 16;

function paintFrame(rows: readonly string[], coat: Coat): PixelCanvas {
  const c = createPixelCanvas(SIZE, SIZE);
  rows.forEach((row, y) => {
    if (row.length !== SIZE)
      throw new Error(`Rabbit frame row ${String(y)} is ${String(row.length)} wide`);
    [...row].forEach((letter, x) => {
      const color = coat[letter as keyof Coat] as Rgba | undefined;
      if (color) setPixel(c, x, y, color);
    });
  });
  return c;
}

export function paintRabbitSprites(): SpriteSource[] {
  return (['white', 'brown'] as const).map((coat) => ({
    key: `rabbit_${coat}`,
    frames: FRAMES.map((rows) => paintFrame(rows, COATS[coat])),
  }));
}
