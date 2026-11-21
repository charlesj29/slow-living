// The village houses (80×80 over a 5×3 footprint; roofs rise up to two tiles
// above it). Each has its own shape, so the village feels lived-in rather than
// built from one plan: a low stone farmhouse under a hipped slate roof, a log
// cabin with a porch, a round thatched cottage, and the baker's shop. A
// village picks three of them per island. Glass glows at night.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  hexToRgba,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import {
  logWall,
  O,
  paintedWall,
  plankDoor,
  roundWindow,
  shingleRows,
  stoneBase,
  stoneChimney,
  stoneWall,
  wallEdges,
  windowAt,
} from './paintHouseParts';
import { PALETTE } from './palette';

const SIZE = 80;
/** The door is on the footprint's middle tile, matching the registry's door. */
const DOOR_X = 40;
const WALL_BOTTOM = 73;
const BASE = { top: 74, bottom: 77 } as const;
const C = PALETTE.cottage;
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

interface Painted {
  readonly canvas: PixelCanvas;
  /** Where chimney smoke leaves (sprite pixels). */
  readonly chimneyTop: { x: number; y: number };
}

/** Low and wide under a hipped slate roof, with a little porch on posts and ivy. */
function stoneFarmhouse(): Painted {
  const c = createPixelCanvas(SIZE, SIZE);
  const chimneyTop = stoneChimney(c, 58, 14, 18);
  const ridge = { y: 28, left: 24, right: 55 };
  const eave = { y: 46, left: 1, right: 78 };
  shingleRows(
    c,
    ridge.y,
    eave.y,
    (y) => {
      const t = (y - ridge.y) / (eave.y - ridge.y);
      return [
        Math.round(lerp(ridge.left, eave.left, t)),
        Math.round(lerp(ridge.right, eave.right, t)),
      ];
    },
    PALETTE.slate,
  );
  fillRect(c, ridge.left, ridge.y - 1, ridge.right - ridge.left + 1, 1, PALETTE.slate.highlight);
  const wall = { left: 4, right: 75, top: 47, bottom: WALL_BOTTOM };
  stoneWall(c, wall);
  wallEdges(c, wall);
  fillRect(c, wall.left, wall.top, wall.right - wall.left + 1, 2, C.stoneDark); // eave shadow
  windowAt(c, 11, 57, 9);
  windowAt(c, 61, 57, 9);
  plankDoor(c, DOOR_X, BASE.top);
  // A lean-to porch over the door on two posts.
  for (const x of [28, 50]) {
    fillRect(c, x - 1, 54, 4, WALL_BOTTOM - 53, O);
    fillRect(c, x, 54, 2, WALL_BOTTOM - 54, PALETTE.bark.base);
  }
  shingleRows(c, 49, 54, (y) => [27 - (y - 49), 53 + (y - 49)], PALETTE.slate);
  // Ivy climbing the left corner.
  for (let y = 49; y < WALL_BOTTOM; y++) {
    for (let x = 4; x < 10; x++) {
      const leaf = (x * 7 + y * 3) % 5;
      if (leaf === 0 && y > 49 + (x - 4) * 2) setPixel(c, x, y, PALETTE.oak.base);
      else if (leaf === 2 && y > 52 + (x - 4) * 2) setPixel(c, x, y, PALETTE.oak.light);
    }
  }
  stoneBase(c, 3, 76, BASE.top, BASE.bottom, DOOR_X);
  return { canvas: c, chimneyTop };
}

/** Logs under a side-gabled mossy roof, a porch with railing, a rocking chair and firewood. */
function logCabin(): Painted {
  const c = createPixelCanvas(SIZE, SIZE);
  const chimneyTop = stoneChimney(c, 14, 10, 18);
  shingleRows(
    c,
    24,
    46,
    (y) => {
      const t = (y - 24) / 22;
      return [Math.round(lerp(8, 1, t)), Math.round(lerp(71, 78, t))];
    },
    PALETTE.moss,
  );
  fillRect(c, 8, 23, 64, 1, PALETTE.moss.highlight); // ridge
  const wall = { left: 4, right: 75, top: 47, bottom: WALL_BOTTOM };
  logWall(c, wall);
  wallEdges(c, wall);
  windowAt(c, 13, 54, 9, { shutters: true });
  windowAt(c, 58, 54, 9, { shutters: true });
  plankDoor(c, DOOR_X, BASE.top);
  // Behind the railing: a rocking chair on the left, a stack of firewood on the right.
  fillRect(c, 15, 58, 2, 10, O);
  fillRect(c, 15, 65, 8, 2, PALETTE.heartwood.dark);
  fillRect(c, 21, 65, 2, 6, O);
  fillRect(c, 13, 71, 12, 1, O);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4 - (row === 2 ? 1 : 0); col++) {
      const x = 57 + col * 4 + (row % 2) * 2;
      const y = 70 - row * 3;
      fillRect(c, x, y, 3, 3, O);
      setPixel(c, x + 1, y + 1, PALETTE.heartwood.base);
    }
  }
  // The porch: a plank roof edge across the front, posts and a railing either side of the door.
  fillRect(c, 1, 47, 78, 4, PALETTE.heartwood.dark);
  fillRect(c, 1, 47, 78, 1, PALETTE.heartwood.base);
  fillRect(c, 1, 51, 78, 1, O);
  for (const x of [3, 30, 49, 75]) {
    fillRect(c, x - 1, 52, 4, WALL_BOTTOM - 51, O);
    fillRect(c, x, 52, 2, WALL_BOTTOM - 52, PALETTE.bark.light);
  }
  for (const [from, to] of [
    [4, 29],
    [50, 74],
  ] as const) {
    for (const y of [63, 68]) {
      fillRect(c, from, y, to - from + 1, 2, O);
      fillRect(c, from, y, to - from + 1, 1, PALETTE.heartwood.light);
    }
    for (let x = from + 3; x < to; x += 4) fillRect(c, x, 65, 1, 3, PALETTE.heartwood.base);
  }
  stoneBase(c, 3, 76, BASE.top, BASE.bottom, DOOR_X);
  return { canvas: c, chimneyTop };
}

/** Whitewashed walls under a big rounded straw roof, a round window and a crooked chimney. */
function thatchedCottage(): Painted {
  const c = createPixelCanvas(SIZE, SIZE);
  // The chimney leans a little: the top half sits one pixel further right.
  stoneChimney(c, 57, 14, 12);
  const chimneyTop = stoneChimney(c, 58, 6, 9);
  const wall = { left: 7, right: 72, top: 50, bottom: WALL_BOTTOM };
  paintedWall(c, wall, C.plasterLight, C.plaster);
  wallEdges(c, wall);
  roundWindow(c, 20, 63, 5);
  windowAt(c, 56, 60, 8, { flowers: true });
  plankDoor(c, DOOR_X, BASE.top, { height: 16 });
  // The thatch: a dome, lit on the left, with straw strokes and a thick, low eave.
  const t = PALETTE.thatch;
  const cx = 39.5;
  const base = 55;
  const rx = 40;
  const ry = 46;
  for (let y = base - ry; y <= base; y++) {
    const half = rx * Math.sqrt(Math.max(0, 1 - ((base - y) / ry) ** 2));
    const left = Math.round(cx - half);
    const right = Math.round(cx + half);
    for (let x = left; x <= right; x++) {
      const stroke = (x * 3 + Math.floor(y / 3)) % 6 === 0;
      const lit = x < cx - (base - y) * 0.2;
      let tone = stroke ? t.dark : lit ? t.light : t.base;
      if (y >= base - 2) tone = t.dark; // the eave's underside
      setPixel(c, x, y, tone);
    }
    setPixel(c, left, y, t.outline);
    setPixel(c, right, y, t.outline);
  }
  fillRect(c, 0, base + 1, SIZE, 1, t.outline);
  fillRect(c, 26, base - ry + 6, 14, 1, t.highlight); // a lit crown
  stoneBase(c, 6, 73, BASE.top, BASE.bottom, DOOR_X);
  return { canvas: c, chimneyTop };
}

const BAKERY = {
  wall: hexToRgba('#f2d58a'),
  fleck: hexToRgba('#f8e4ae'),
  bread: hexToRgba('#c98a46'),
  crust: hexToRgba('#8e5a2a'),
} as const;

/** The baker's: a butter-yellow shop under a tiled roof, a striped awning and bread in the window. */
function bakery(): Painted {
  const c = createPixelCanvas(SIZE, SIZE);
  const chimneyTop = stoneChimney(c, 54, 8, 16);
  shingleRows(
    c,
    22,
    40,
    (y) => {
      const t = (y - 22) / 18;
      return [Math.round(lerp(7, 1, t)), Math.round(lerp(72, 78, t))];
    },
    PALETTE.terracotta,
  );
  fillRect(c, 7, 21, 66, 1, PALETTE.terracotta.highlight);
  const wall = { left: 4, right: 75, top: 41, bottom: WALL_BOTTOM };
  paintedWall(c, wall, BAKERY.wall, BAKERY.fleck);
  wallEdges(c, wall);
  for (const y of [41, 55]) fillRect(c, wall.left, y, wall.right - wall.left + 1, 2, C.beam);
  windowAt(c, 13, 44, 8, { flowers: true });
  windowAt(c, 45, 44, 8, { flowers: true });
  // The display window, with loaves on a shelf.
  fillRect(c, 7, 59, 24, 13, O);
  fillRect(c, 8, 60, 22, 11, PALETTE.cabin.glass);
  fillRect(c, 8, 68, 22, 1, C.frame);
  for (const x of [10, 16, 22]) {
    fillRect(c, x, 65, 5, 3, BAKERY.bread);
    fillRect(c, x, 67, 5, 1, BAKERY.crust);
    setPixel(c, x + 1, 65, BAKERY.fleck);
  }
  setPixel(c, 9, 61, PALETTE.cabin.shine);
  plankDoor(c, DOOR_X, BASE.top, { height: 16, color: PALETTE.teal.dark });
  windowAt(c, 56, 61, 8);
  // A striped awning over the shop front.
  fillRect(c, 4, 56, 72, 5, O);
  for (let x = 5; x < 75; x++) {
    const stripe = Math.floor((x - 5) / 5) % 2 === 0 ? PALETTE.quilt.base : PALETTE.paper.base;
    fillRect(c, x, 57, 1, 3, stripe);
  }
  for (let x = 5; x < 75; x += 5) fillRect(c, x + 1, 60, 3, 2, O);
  // A hanging sign with a loaf on it, on a bracket at the right.
  fillRect(c, 63, 42, 14, 1, O);
  for (const x of [65, 74]) setPixel(c, x, 43, O);
  fillRect(c, 63, 44, 14, 9, O);
  fillRect(c, 64, 45, 12, 7, PALETTE.heartwood.light);
  fillRect(c, 66, 47, 8, 3, BAKERY.bread);
  fillRect(c, 66, 49, 8, 1, BAKERY.crust);
  stoneBase(c, 3, 76, BASE.top, BASE.bottom, DOOR_X);
  return { canvas: c, chimneyTop };
}

const PAINTERS: Readonly<Record<string, () => Painted>> = {
  house_stone: stoneFarmhouse,
  house_log: logCabin,
  house_thatch: thatchedCottage,
  house_bakery: bakery,
};

/** Where smoke leaves each house's chimney (sprite pixels from the top-left). */
export const HOUSE_CHIMNEY_TOPS: Readonly<Record<string, { x: number; y: number }>> =
  Object.fromEntries(Object.entries(PAINTERS).map(([key, paint]) => [key, paint().chimneyTop]));

export function paintHouseSprites(): SpriteSource[] {
  return Object.entries(PAINTERS).map(([key, paint]) => ({ key, frames: [paint().canvas] }));
}
