// The village kid and their ball, soft and round like the rabbits.
// The kid (big round head, brown bob, yellow dress, red shoes) has three views
// (front, back, side facing left) of five frames: stand, two walk steps, throw
// (an arm up) and cheer (both arms up). The puppy is in paintPuppy.ts.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import { hexToRgba, type Rgba } from '@/shared/render/pixelCanvas';
import { capsule, ellipse, outline, put, softCanvas, softGrid, type SoftGrid } from './softShapes';

export const KID_FRAMES = { stand: 0, walk: [1, 2], throw: 3, cheer: 4 } as const;
export const KID_FRAME_COUNT = 5;
export const KID_VIEWS = ['front', 'back', 'side'] as const;
export type KidView = (typeof KID_VIEWS)[number];
export const kidKey = (view: KidView): string => `kid_${view}`;

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
    { key: BALL_KEY, frames: [softCanvas(ball(), BALL_COLORS)] },
  ];
}
