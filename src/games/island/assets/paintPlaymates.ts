// The village kid, the puppy and their ball, soft and round like the rabbits.
// The kid (big round head, brown bob, yellow dress, red shoes) has three views
// (front, back, side facing left) of five frames: stand, two walk steps, throw
// (an arm up) and cheer (both arms up). The puppy is seen from the side facing
// left: sit, wag, two trot steps, sniff (nose down) and asleep (curled up).
import type { SpriteSource } from '@/shared/render/atlasLayout';
import { hexToRgba, type Rgba } from '@/shared/render/pixelCanvas';
import { capsule, ellipse, outline, put, softCanvas, softGrid, type SoftGrid } from './softShapes';

export const KID_FRAMES = { stand: 0, walk: [1, 2], throw: 3, cheer: 4 } as const;
export const KID_FRAME_COUNT = 5;
export const KID_VIEWS = ['front', 'back', 'side'] as const;
export type KidView = (typeof KID_VIEWS)[number];
export const kidKey = (view: KidView): string => `kid_${view}`;

export const DOG_FRAMES = { sit: 0, wag: 1, trot: [2, 3], sniff: 4, sleep: 5 } as const;
export const DOG_FRAME_COUNT = 6;
export const DOG_KEY = 'dog_side';
export const BALL_KEY = 'ball';

const KID_W = 14;
const KID_H = 19;

/** Legs as [x1, y1, x2, y2] pairs for each kid frame (front/back and side). */
const FRONT_LEGS = {
  stand: [
    [5.6, 14.5, 5.6, 17],
    [8.4, 14.5, 8.4, 17],
  ],
  walk0: [
    [5.6, 14.5, 5.4, 16.3],
    [8.4, 14.5, 8.6, 17],
  ],
  walk1: [
    [5.6, 14.5, 5.4, 17],
    [8.4, 14.5, 8.6, 16.3],
  ],
} as const;
const SIDE_LEGS = {
  stand: [[7, 14.5, 7, 17]],
  walk0: [
    [6.6, 14.5, 5.2, 17],
    [7.6, 14.5, 9, 17],
  ],
  walk1: [
    [6.8, 14.5, 7.4, 17],
    [7.2, 14.5, 6.4, 17],
  ],
} as const;

function legsFor(frame: number, side: boolean): readonly (readonly number[])[] {
  const legs = side ? SIDE_LEGS : FRONT_LEGS;
  if (frame === KID_FRAMES.walk[0]) return legs.walk0;
  if (frame === KID_FRAMES.walk[1]) return legs.walk1;
  return legs.stand;
}

function kidFrontOrBack(frame: number, front: boolean): SoftGrid {
  const g = softGrid(KID_W, KID_H);
  for (const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] of legsFor(frame, false)) {
    capsule(g, x1, y1, x2, y2, 0.8, 'l');
    put(g, x2, y2, 'k');
  }
  const throwing = frame === KID_FRAMES.throw;
  const cheering = frame === KID_FRAMES.cheer;
  ellipse(g, 7, 12.6, 3.5, 2.8, 'd', 'D');
  // Arms: down at the sides, or up (the throwing arm, or both to cheer).
  capsule(g, 3.8, 11.4, cheering ? 2.4 : 2.8, cheering ? 8 : 13.6, 0.8, 'f');
  capsule(
    g,
    10.2,
    11.4,
    throwing || cheering ? 11.6 : 11.2,
    throwing || cheering ? 8 : 13.6,
    0.8,
    'f',
  );
  ellipse(g, 7, 6.6, 4.4, 4.2, 'f');
  // Hair: a bob with a fringe from the front; all hair from behind.
  for (let y = 0; y < KID_H; y++) {
    for (let x = 0; x < KID_W; x++) {
      const nx = (x - 7) / 4.6;
      const ny = (y - 6.4) / 4.4;
      if (nx * nx + ny * ny > 1) continue;
      const fringe = y < 5.6 || (Math.abs(x - 7) > 3 && y < 9);
      if (!front || fringe) put(g, x, y, 'h');
    }
  }
  if (front) {
    put(g, 5.4, 7.4, 'e');
    put(g, 8.6, 7.4, 'e');
    put(g, 4.6, 8.5, 'p');
    put(g, 9.4, 8.5, 'p');
  }
  outline(g);
  return g;
}

function kidSide(frame: number): SoftGrid {
  const g = softGrid(KID_W, KID_H);
  for (const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] of legsFor(frame, true)) {
    capsule(g, x1, y1, x2, y2, 0.8, 'l');
    put(g, x2 - 0.6, y2, 'k');
    put(g, x2, y2, 'k');
  }
  ellipse(g, 7.2, 12.6, 3.1, 2.8, 'd', 'D');
  ellipse(g, 6.6, 6.6, 4.2, 4.1, 'f');
  for (let y = 0; y < KID_H; y++) {
    for (let x = 0; x < KID_W; x++) {
      const nx = (x - 6.9) / 4.5;
      const ny = (y - 6.3) / 4.4;
      if (nx * nx + ny * ny <= 1 && (y < 5.4 || x > 6.6)) put(g, x, y, 'h');
    }
  }
  put(g, 4.2, 7.4, 'e');
  put(g, 5, 8.5, 'p');
  // The near arm: down, thrown forward and up, or raised.
  if (frame === KID_FRAMES.throw) capsule(g, 7, 11.2, 4.4, 8.4, 0.8, 'f');
  else if (frame === KID_FRAMES.cheer) capsule(g, 7, 11.2, 7.6, 7.8, 0.8, 'f');
  else capsule(g, 7, 11.2, 6.4, 13.8, 0.8, 'f');
  outline(g);
  return g;
}

const KID_COLORS: Readonly<Record<string, Rgba>> = {
  o: hexToRgba('#4a3028'),
  f: hexToRgba('#ffd9b8'),
  h: hexToRgba('#8a5233'),
  d: hexToRgba('#f6c445'),
  D: hexToRgba('#d9a22e'),
  l: hexToRgba('#fff4e6'),
  k: hexToRgba('#c2553f'),
  e: hexToRgba('#2a1a14'),
  p: hexToRgba('#f7a3a0'),
};

const DOG_W = 17;
const DOG_H = 13;

/** The puppy facing left; paws on the bottom row. */
function dog(frame: number): SoftGrid {
  const g = softGrid(DOG_W, DOG_H);
  if (frame === DOG_FRAMES.sleep) {
    capsule(g, 13, 9.4, 11, 11.4, 1.1, 'w'); // the tail curled round
    ellipse(g, 8.6, 9.4, 5.6, 2.6, 'w', 's');
    ellipse(g, 4.4, 9.6, 3.1, 2.4, 'w');
    capsule(g, 5.6, 8, 6.6, 10, 1, 'k');
    ellipse(g, 2.6, 10.4, 1.5, 1.1, 'b');
    put(g, 1.2, 10, 'n');
    put(g, 3.4, 9.4, 'o'); // a closed eye
    put(g, 4.2, 10.6, 'p');
    outline(g);
    return g;
  }
  const sitting = frame === DOG_FRAMES.sit || frame === DOG_FRAMES.wag;
  const sniffing = frame === DOG_FRAMES.sniff;
  // The tail: up and curled, swishing the other way when wagging.
  const tailTip = frame === DOG_FRAMES.wag ? [15.4, 6.4] : [14.6, 3.8];
  capsule(g, 12.6, sitting ? 8.6 : 7, tailTip[0] ?? 0, tailTip[1] ?? 0, 1.1, 'w');
  if (sitting) {
    ellipse(g, 11, 10.4, 2.6, 1.8, 'w', 's'); // the haunch
    capsule(g, 6.8, 9, 6.8, 11.8, 0.9, 'w');
    capsule(g, 8.4, 9, 8.4, 11.8, 0.9, 's');
    ellipse(g, 9.4, 8.2, 3.6, 3.2, 'w', 's');
    ellipse(g, 8.4, 9.6, 1.8, 1.6, 'b');
  } else {
    const step = frame === DOG_FRAMES.trot[0] ? 1 : frame === DOG_FRAMES.trot[1] ? -1 : 0;
    capsule(g, 5.8, 9.5, 5.8 - step, 11.8, 0.9, 'w');
    capsule(g, 7.4, 9.5, 7.4 + step, 11.8, 0.9, 's');
    capsule(g, 11, 9.5, 11 + step, 11.8, 0.9, 's');
    capsule(g, 12.6, 9.5, 12.6 - step, 11.8, 0.9, 'w');
    ellipse(g, 9.2, 8.2, 4.8, 3, 'w', 's');
    ellipse(g, 8.6, 9.6, 2.8, 1.3, 'b');
  }
  const hx = sitting ? 5.6 : sniffing ? 4 : 4.6;
  const hy = sitting ? 4.6 : sniffing ? 8.2 : 5.8;
  ellipse(g, hx, hy, 3.3, 3, 'w');
  capsule(g, hx + 1.2, hy - 2, hx + 2, hy + 0.6, 1, 'k'); // a floppy ear
  ellipse(g, hx - 2.2, hy + 1, 1.6, 1.2, 'b'); // the muzzle
  put(g, hx - 3.4, hy + 0.4, 'n');
  put(g, hx - 0.9, hy - 0.6, 'e');
  put(g, hx - 0.2, hy + 1.2, 'p');
  outline(g);
  return g;
}

const DOG_COLORS: Readonly<Record<string, Rgba>> = {
  o: hexToRgba('#5a3624'),
  w: hexToRgba('#f0b878'),
  s: hexToRgba('#d4955a'),
  b: hexToRgba('#fff3e2'),
  k: hexToRgba('#c47a44'),
  e: hexToRgba('#2a1a14'),
  n: hexToRgba('#3a2420'),
  p: hexToRgba('#f5a6a0'),
};

function ball(): SoftGrid {
  const g = softGrid(6, 6);
  ellipse(g, 2.5, 2.5, 2, 2, 'r');
  put(g, 1.6, 1.6, 'w');
  put(g, 2.5, 3.6, 'R');
  put(g, 3.5, 3, 'R');
  outline(g);
  return g;
}

const BALL_COLORS: Readonly<Record<string, Rgba>> = {
  o: hexToRgba('#5a2a24'),
  r: hexToRgba('#e8604c'),
  R: hexToRgba('#c24838'),
  w: hexToRgba('#ffe2d8'),
};

const frames = (
  draw: (frame: number) => SoftGrid,
  count: number,
  colors: Readonly<Record<string, Rgba>>,
) => Array.from({ length: count }, (_, frame) => softCanvas(draw(frame), colors));

export function paintPlaymateSprites(): SpriteSource[] {
  return [
    {
      key: kidKey('front'),
      frames: frames((f) => kidFrontOrBack(f, true), KID_FRAME_COUNT, KID_COLORS),
    },
    {
      key: kidKey('back'),
      frames: frames((f) => kidFrontOrBack(f, false), KID_FRAME_COUNT, KID_COLORS),
    },
    { key: kidKey('side'), frames: frames(kidSide, KID_FRAME_COUNT, KID_COLORS) },
    { key: DOG_KEY, frames: frames(dog, DOG_FRAME_COUNT, DOG_COLORS) },
    { key: BALL_KEY, frames: [softCanvas(ball(), BALL_COLORS)] },
  ];
}
