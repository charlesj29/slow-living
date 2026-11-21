// The Developer's Studio as a log lodge (112×80 over a 7×4 footprint), one
// storey, compact and simple: logs under a cedar shingle roof, a stone chimney,
// a covered porch across the front with posts, railings, a bench and two
// lanterns, and a carved "</>" sign on the wall above the porch. Small windows
// and the lanterns glow at night.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import {
  logWall,
  O,
  plankDoor,
  shingleRows,
  stoneBase,
  stoneChimney,
  wallEdges,
  windowAt,
} from './paintHouseParts';
import { PALETTE } from './palette';

const WIDTH = 112;
const HEIGHT = 80;
/** The door is on the footprint's fourth tile, matching the registry's door. */
const DOOR_X = 56;
const WALL = { left: 5, right: 106, top: 40, bottom: 73 } as const;
const ROOF = { top: 14, eave: 39 } as const;
const PORCH = { roofTop: 50, roofBottom: 55, posts: [8, 40, 71, 103] } as const;
/** Cedar shingles: warm brown, so the lodge stands apart from the village's mossy log cabin. */
const ROOF_WOOD = PALETTE.dock;
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function roof(c: PixelCanvas): void {
  shingleRows(
    c,
    ROOF.top,
    ROOF.eave,
    (y) => {
      const t = (y - ROOF.top) / (ROOF.eave - ROOF.top);
      return [Math.round(lerp(16, 2, t)), Math.round(lerp(95, 109, t))];
    },
    ROOF_WOOD,
  );
  fillRect(c, 16, ROOF.top - 1, 80, 1, ROOF_WOOD.highlight); // the ridge
}

function walls(c: PixelCanvas): void {
  logWall(c, WALL);
  wallEdges(c, WALL);
  fillRect(c, WALL.left, WALL.top, WALL.right - WALL.left + 1, 2, PALETTE.bark.outline); // eave shadow
  // A shuttered window either side of the door, under the porch.
  for (const x of [20, 82]) windowAt(c, x, 57, 9, { shutters: true });
  plankDoor(c, DOOR_X, WALL.bottom + 1);
}

/** A bench under the porch, left of the door. */
function bench(c: PixelCanvas): void {
  fillRect(c, 13, 64, 22, 2, O);
  fillRect(c, 13, 66, 22, 3, PALETTE.heartwood.base);
  fillRect(c, 13, 66, 22, 1, PALETTE.heartwood.light);
  for (const x of [14, 32]) fillRect(c, x, 69, 2, 5, O);
}

/** The porch: a shingled roof across the front, posts, railings either side and lanterns. */
function porch(c: PixelCanvas): void {
  shingleRows(c, PORCH.roofTop, PORCH.roofBottom, () => [3, 108], ROOF_WOOD);
  for (const x of PORCH.posts) {
    fillRect(c, x - 1, PORCH.roofBottom + 2, 4, WALL.bottom - PORCH.roofBottom - 1, O);
    fillRect(c, x, PORCH.roofBottom + 2, 2, WALL.bottom - PORCH.roofBottom - 2, PALETTE.bark.light);
  }
  const [a, b, d, e] = PORCH.posts;
  for (const [from, to] of [
    [a + 2, b - 1],
    [d + 2, e - 1],
  ] as const) {
    for (const y of [66, 70]) {
      fillRect(c, from, y, to - from + 1, 2, O);
      fillRect(c, from, y, to - from + 1, 1, PALETTE.heartwood.light);
    }
    for (let x = from + 3; x < to; x += 4) fillRect(c, x, 68, 1, 2, PALETTE.heartwood.base);
  }
  // Lanterns on the two middle posts (their glass glows at night).
  for (const x of [b - 6, d + 3]) {
    fillRect(c, x, 57, 6, 8, O);
    fillRect(c, x + 1, 59, 4, 5, PALETTE.cabin.glass);
    setPixel(c, x + 2, 60, PALETTE.cabin.shine);
  }
}

/** A plank with "</>" carved in, on the wall above the porch roof. */
function sign(c: PixelCanvas): void {
  const left = 44;
  const top = 41;
  fillRect(c, left, top, 24, 9, O);
  fillRect(c, left + 1, top + 1, 22, 7, PALETTE.heartwood.base);
  fillRect(c, left + 1, top + 1, 22, 1, PALETTE.heartwood.light);
  const carved = PALETTE.bark.outline; // deep enough to read from afar
  // prettier-ignore
  const glyphs: readonly (readonly [number, number])[] = [
    [7, 2], [6, 3], [5, 4], [6, 5], [7, 6], // <
    [13, 1], [12, 2], [12, 3], [11, 4], [11, 5], [10, 6], // /
    [16, 2], [17, 3], [18, 4], [17, 5], [16, 6], // >
  ];
  for (const [x, y] of glyphs) setPixel(c, left + x, top + y + 1, carved);
}

function paintStudio(): { canvas: PixelCanvas; chimneyTop: { x: number; y: number } } {
  const c = createPixelCanvas(WIDTH, HEIGHT);
  const chimneyTop = stoneChimney(c, 88, 2, 24);
  roof(c);
  walls(c);
  sign(c);
  bench(c);
  porch(c);
  stoneBase(c, 3, WIDTH - 4, WALL.bottom + 1, HEIGHT - 3, DOOR_X);
  return { canvas: c, chimneyTop };
}

/** Where smoke leaves the studio's chimney (sprite pixels from the top-left). */
export const STUDIO_CHIMNEY_TOP = paintStudio().chimneyTop;

export function paintStudioSprites(): SpriteSource[] {
  return [{ key: 'studio', frames: [paintStudio().canvas] }];
}
