// A cosy umbrella for a rainy day: a round coral canopy with cream ribs
// fanning from the top, a scalloped rim, and a wooden handle with a hook.
// Painted in two layers that line up exactly: the canopy (drawn behind the
// villager, so it rises over the head) and the handle (drawn in front, so the
// hand visibly holds it). Upright for walking and standing; leaning back over
// the shoulder for sitting. Both turn about the hand, so the grip never moves.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import { hexToRgba, type Rgba } from '@/shared/render/pixelCanvas';
import {
  capsule,
  outline,
  put,
  rotateAbout,
  softCanvas,
  softGrid,
  type SoftGrid,
} from './softShapes';

export const UMBRELLA_KEYS = {
  canopy: 'umbrella_canopy',
  handle: 'umbrella_handle',
  canopyLeaning: 'umbrella_canopy_leaning',
  handleLeaning: 'umbrella_handle_leaning',
} as const;
/** Where the hand holds it, from the sprites' top-left (the same in every layer and pose). */
export const UMBRELLA_GRIP = { x: 20, y: 25 } as const;

/** Odd width, so the grip column is the middle one and mirroring keeps it in the hand. */
const W = 41;
const H = 28;
const CX = UMBRELLA_GRIP.x;
const RIM_Y = 10;
const RADIUS = { x: 9, y: 8.5 } as const;
const PANELS = 6;
/** How much of each panel is a cream rib (its leading edge). */
const RIB_SHARE = 0.28;
/** Sitting, the umbrella rests on the shoulder, leaning back and out (clockwise, for the right hand). */
const LEAN_RADIANS = 0.32;

function canopy(): SoftGrid {
  const g = softGrid(W, H);
  for (let y = 0; y <= RIM_Y; y++) {
    for (let x = 0; x < W; x++) {
      const nx = (x - CX) / RADIUS.x;
      const ny = (y - RIM_Y) / RADIUS.y;
      if (nx * nx + ny * ny > 1) continue;
      // A scalloped rim: the bottom row dips between the ribs.
      if (y === RIM_Y && Math.abs(x - CX) % 3 === 1) continue;
      const angle = Math.atan2(x - CX, RIM_Y + 2 - y) + Math.PI / 2;
      const rib = ((angle / Math.PI) * PANELS) % 1 < RIB_SHARE;
      put(g, x, y, rib ? 'c' : y >= RIM_Y - 1 || x > CX + 5 ? 's' : 'r');
    }
  }
  put(g, CX, RIM_Y - RADIUS.y - 0.6, 'y'); // the knob on top
  return g;
}

function handle(): SoftGrid {
  const g = softGrid(W, H);
  capsule(g, CX, RIM_Y + 1, CX, UMBRELLA_GRIP.y, 0.4, 'h');
  // The hook curls round below the hand.
  put(g, CX + 1, UMBRELLA_GRIP.y + 1, 'h');
  put(g, CX + 2, UMBRELLA_GRIP.y + 1, 'h');
  put(g, CX + 2, UMBRELLA_GRIP.y, 'h');
  return g;
}

function layer(grid: SoftGrid, radians: number): SoftGrid {
  const g = radians === 0 ? grid : rotateAbout(grid, radians, UMBRELLA_GRIP.x, UMBRELLA_GRIP.y);
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
  const sprite = (key: string, grid: SoftGrid, radians: number): SpriteSource => ({
    key,
    frames: [softCanvas(layer(grid, radians), COLORS)],
  });
  return [
    sprite(UMBRELLA_KEYS.canopy, canopy(), 0),
    sprite(UMBRELLA_KEYS.handle, handle(), 0),
    sprite(UMBRELLA_KEYS.canopyLeaning, canopy(), LEAN_RADIANS),
    sprite(UMBRELLA_KEYS.handleLeaning, handle(), LEAN_RADIANS),
  ];
}
