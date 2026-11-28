// Little birds, soft and round like the rabbits: a plump ball of a body with
// the head tucked into it, a stubby tail, a dot of an eye, a rosy cheek and a
// tiny beak. Two colours (a brown sparrow and a blue tit), seen from the side
// facing left (mirrored for right), with five frames: stand, blink, peck, wings
// up and wings down. And a seagull seen from above, gliding or flapping.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import { hexToRgba, type Rgba } from '@/shared/render/pixelCanvas';
import { capsule, ellipse, outline, put, softCanvas, softGrid, type SoftGrid } from './softShapes';

export const BIRD_FRAMES = { stand: 0, blink: 1, peck: 2, wingsUp: 3, wingsDown: 4 } as const;
export const BIRD_FRAME_COUNT = 5;
export const BIRD_COLORS = ['brown', 'blue'] as const;
export type BirdColor = (typeof BIRD_COLORS)[number];
export const birdKey = (color: BirdColor): string => `bird_${color}`;
export const GULL_KEYS = { glide: 'gull_glide', flap: 'gull_flap' } as const;

const BIRD_W = 12;
const BIRD_H = 11;

/** A small bird facing left; feet on the bottom row. */
function bird(frame: number): SoftGrid {
  const g = softGrid(BIRD_W, BIRD_H);
  const flying = frame === BIRD_FRAMES.wingsUp || frame === BIRD_FRAMES.wingsDown;
  const peck = frame === BIRD_FRAMES.peck;
  const by = flying ? 6 : 6.5;
  if (!flying) {
    put(g, 5, 10, 'l');
    put(g, 7, 10, 'l');
  }
  capsule(g, 8.5, by - 0.5, 10.6, by - 2, 0.9, 'k'); // the tail
  ellipse(g, 6.3, by, 3.6, 3, 'w', 's');
  ellipse(g, 5.6, by + 1.2, 2.2, 1.6, 'b'); // the belly
  const hx = peck ? 3.4 : 4;
  const hy = peck ? by + 0.8 : by - 2.2;
  ellipse(g, hx, hy, 2.5, 2.3, 'w');
  if (frame === BIRD_FRAMES.wingsUp) capsule(g, 6.6, by - 1, 8, by - 4.6, 1.2, 'k');
  else if (frame === BIRD_FRAMES.wingsDown) capsule(g, 6.6, by, 8, by + 3.4, 1.2, 'k');
  else ellipse(g, 7.2, by + 0.2, 1.9, 1.3, 'k'); // the folded wing
  put(g, hx - 2.6, hy + 0.5, 'y'); // beak
  put(g, hx - 0.8, hy - 0.4, frame === BIRD_FRAMES.blink ? 'w' : 'e');
  put(g, hx - 0.3, hy + 0.8, 'p'); // a rosy cheek
  outline(g);
  return g;
}

const BIRD_COATS: Readonly<Record<BirdColor, Readonly<Record<string, Rgba>>>> = {
  brown: {
    o: hexToRgba('#4a3226'),
    w: hexToRgba('#c69768'),
    s: hexToRgba('#a5774e'),
    b: hexToRgba('#f6e8d0'),
    k: hexToRgba('#86593a'),
    e: hexToRgba('#231812'),
    y: hexToRgba('#f2a943'),
    p: hexToRgba('#f2a7a0'),
    l: hexToRgba('#c98550'),
  },
  blue: {
    o: hexToRgba('#2d3550'),
    w: hexToRgba('#7fb2e6'),
    s: hexToRgba('#5d8fc6'),
    b: hexToRgba('#fbe58a'),
    k: hexToRgba('#4a6fa8'),
    e: hexToRgba('#1b1f2e'),
    y: hexToRgba('#f2a943'),
    p: hexToRgba('#f5a9b4'),
    l: hexToRgba('#9a7a6a'),
  },
};

/** A seagull overhead, wings spread: white body, grey wings with darker tips. */
function gull(flap: boolean): SoftGrid {
  const g = softGrid(17, 9);
  const tipY = flap ? 1.2 : 3.2;
  capsule(g, 8.5, 4.4, 1.5, tipY, 1.2, 'k');
  capsule(g, 8.5, 4.4, 15.5, tipY, 1.2, 'k');
  capsule(g, 8.5, 4.4, 3.4, tipY + 0.4, 1.2, 'w');
  capsule(g, 8.5, 4.4, 13.6, tipY + 0.4, 1.2, 'w');
  ellipse(g, 8.5, 5, 1.7, 3, 'b');
  put(g, 8.5, 1.6, 'y');
  outline(g);
  return g;
}

const GULL_COLORS: Readonly<Record<string, Rgba>> = {
  o: hexToRgba('#5a6470'),
  w: hexToRgba('#d9e0e6'),
  k: hexToRgba('#7d8792'),
  b: hexToRgba('#ffffff'),
  y: hexToRgba('#f2b84a'),
};

export function paintBirdSprites(): SpriteSource[] {
  return [
    ...BIRD_COLORS.map((color) => ({
      key: birdKey(color),
      frames: Array.from({ length: BIRD_FRAME_COUNT }, (_, frame) =>
        softCanvas(bird(frame), BIRD_COATS[color]),
      ),
    })),
    { key: GULL_KEYS.glide, frames: [softCanvas(gull(false), GULL_COLORS)] },
    { key: GULL_KEYS.flap, frames: [softCanvas(gull(true), GULL_COLORS)] },
  ];
}
