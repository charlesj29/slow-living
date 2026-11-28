// A cosy umbrella for a rainy stroll: a round coral canopy with cream
// stripes fanning from the top, a scalloped rim, and a wooden handle with a
// hook. Soft round shapes, outlined automatically (like the rabbits).
import type { SpriteSource } from '@/shared/render/atlasLayout';
import { hexToRgba, type Rgba } from '@/shared/render/pixelCanvas';
import { capsule, outline, put, softCanvas, softGrid } from './softShapes';

export const UMBRELLA_KEY = 'umbrella';
/** Where the hand holds it, from the sprite's top-left (map pixels). */
export const UMBRELLA_GRIP = { x: 8, y: 21 } as const;

const W = 17;
const H = 24;
const RIM_Y = 8;
const PANELS = 6;
/** How much of each panel is a cream stripe (its leading edge). */
const STRIPE_SHARE = 0.3;

function umbrella(): ReturnType<typeof softGrid> {
  const g = softGrid(W, H);
  const cx = 8;
  for (let y = 0; y <= RIM_Y; y++) {
    for (let x = 0; x < W; x++) {
      const nx = (x - cx) / 8;
      const ny = (y - RIM_Y) / 7.5;
      if (nx * nx + ny * ny > 1) continue;
      // A scalloped rim: the bottom row dips between the ribs.
      if (y === RIM_Y && Math.abs(x - cx) % 4 === 2) continue;
      const angle = Math.atan2(x - cx, RIM_Y + 2 - y) + Math.PI / 2;
      const stripe = ((angle / Math.PI) * PANELS) % 1 < STRIPE_SHARE;
      put(g, x, y, stripe ? 'c' : y >= RIM_Y - 1 || x > cx + 4 ? 's' : 'r');
    }
  }
  put(g, cx, 0, 'y'); // the knob on top
  capsule(g, cx, RIM_Y + 1, cx, UMBRELLA_GRIP.y, 0.4, 'h');
  put(g, cx + 1, UMBRELLA_GRIP.y + 1, 'h');
  put(g, cx + 2, UMBRELLA_GRIP.y + 1, 'h');
  put(g, cx + 2, UMBRELLA_GRIP.y, 'h');
  outline(g);
  return g;
}

const COLORS: Readonly<Record<string, Rgba>> = {
  o: hexToRgba('#5a2f34'),
  r: hexToRgba('#f08e8a'),
  s: hexToRgba('#d56d72'),
  c: hexToRgba('#fff1d8'),
  h: hexToRgba('#8a5a38'),
  y: hexToRgba('#f6d27a'),
};

export function paintUmbrellaSprites(): SpriteSource[] {
  return [{ key: UMBRELLA_KEY, frames: [softCanvas(umbrella(), COLORS)] }];
}
