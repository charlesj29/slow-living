// Furniture for interiors. Sprites stand on the bottom of their footprint and
// may rise above it (bookshelf and fireplace reach up the back wall). The
// fireplace's flames and the floor lamp's shade glow at night (paintLights).
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { fillEllipse, fillShape, insideEllipse } from './paint';
import { PALETTE } from './palette';

const O = PALETTE.wall.outline;

/** 32×40 over 2×2: a wooden bed, pillow at the head, a red quilt. */
function bed(): PixelCanvas {
  const c = createPixelCanvas(32, 40);
  const wood = PALETTE.dock;
  fillRect(c, 1, 0, 30, 40, O);
  fillRect(c, 2, 1, 28, 8, wood.base); // headboard
  fillRect(c, 2, 1, 28, 1, wood.light);
  fillRect(c, 2, 9, 28, 30, PALETTE.quilt.base);
  fillRect(c, 4, 10, 24, 7, PALETTE.cabin.shine); // pillow
  fillRect(c, 4, 16, 24, 1, PALETTE.wallpaper.stripe);
  for (let y = 19; y < 38; y += 4) fillRect(c, 2, y, 28, 1, PALETTE.quilt.dark);
  for (let x = 9; x < 30; x += 7) fillRect(c, x, 18, 1, 20, PALETTE.quilt.dark);
  fillRect(c, 2, 18, 28, 1, PALETTE.quilt.light);
  fillRect(c, 2, 37, 28, 2, wood.dark); // foot board
  return c;
}

/** 32×24 over 2×1: a wooden table top with legs. */
function table(): PixelCanvas {
  const c = createPixelCanvas(32, 24);
  const wood = PALETTE.dock;
  fillRect(c, 0, 4, 32, 12, O);
  fillRect(c, 1, 5, 30, 9, wood.light);
  fillRect(c, 1, 13, 30, 2, wood.dark);
  for (let x = 4; x < 30; x += 8) fillRect(c, x, 6, 1, 6, wood.base);
  for (const x of [2, 27]) {
    fillRect(c, x, 15, 3, 9, O);
    fillRect(c, x + 1, 15, 1, 8, wood.base);
  }
  // A small vase of flowers.
  fillRect(c, 14, 0, 4, 6, PALETTE.terracotta.base);
  setPixel(c, 15, 0, PALETTE.flowers.red.petal);
  setPixel(c, 16, 0, PALETTE.flowers.yellow.petal);
  return c;
}

/** 16×20: a chair with a back rest. */
function chair(): PixelCanvas {
  const c = createPixelCanvas(16, 20);
  const wood = PALETTE.dock;
  fillRect(c, 3, 0, 10, 8, O);
  fillRect(c, 4, 1, 8, 6, wood.base);
  fillRect(c, 4, 1, 8, 1, wood.light);
  fillRect(c, 2, 8, 12, 5, O);
  fillRect(c, 3, 9, 10, 3, wood.light);
  for (const x of [3, 11]) fillRect(c, x, 13, 2, 7, O);
  return c;
}

/** 32×40 over 2×1: a bookshelf against the wall, three shelves of books. */
function bookshelf(): PixelCanvas {
  const c = createPixelCanvas(32, 40);
  const wood = PALETTE.bark;
  fillRect(c, 0, 0, 32, 40, O);
  fillRect(c, 1, 1, 30, 38, wood.base);
  const spines = [
    PALETTE.quilt.base,
    PALETTE.slate.base,
    PALETTE.moss.base,
    PALETTE.thatch.light,
    PALETTE.terracotta.base,
    PALETTE.flowers.blue.petal,
  ];
  for (const top of [3, 15, 27]) {
    fillRect(c, 2, top, 28, 10, wood.outline);
    let x = 3;
    let n = top;
    while (x < 29) {
      const width = 2 + (n % 2);
      const height = 7 + (n % 3);
      fillRect(c, x, top + 10 - height, width, height, spines[n % spines.length] ?? wood.light);
      x += width + 1;
      n += 3;
    }
    fillRect(c, 1, top + 10, 30, 2, wood.light); // the shelf board
  }
  return c;
}

/** Frames in the fireplace's flame loop. */
export const FIRE_FRAME_COUNT = 4;

/** Per frame: how tall each tongue of flame reaches, and a spark above it (or none). */
const FLAME_FRAMES: readonly {
  readonly heights: readonly [left: number, middle: number, right: number];
  readonly spark: readonly [x: number, y: number] | null;
}[] = [
  { heights: [4, 7, 5], spark: [14, 26] },
  { heights: [5, 6, 4], spark: null },
  { heights: [3, 8, 5], spark: [18, 25] },
  { heights: [5, 7, 3], spark: [15, 24] },
];

/** 32×40 over 2×1: a stone fireplace with a wooden mantle and a crackling fire (one frame). */
function fireplace(frame: number): PixelCanvas {
  const c = createPixelCanvas(32, 40);
  const stone = PALETTE.cottage;
  fillRect(c, 0, 8, 32, 32, O);
  fillRect(c, 1, 9, 30, 30, stone.stone);
  for (let y = 9; y < 39; y += 5) fillRect(c, 1, y, 30, 1, stone.stoneDark);
  fillRect(c, 0, 4, 32, 6, O); // mantle
  fillRect(c, 1, 5, 30, 3, PALETTE.dock.light);
  fillRect(c, 8, 18, 16, 21, O); // opening
  fillRect(c, 9, 19, 14, 20, PALETTE.wallTop.base);
  const fire = PALETTE.fire;
  const flames = FLAME_FRAMES[frame % FLAME_FRAMES.length] ?? FLAME_FRAMES[0];
  // A glowing bed, then three tongues of flame that rise and fall frame by frame.
  fillShape(c, (x, y) => insideEllipse(x, y, 16, 36, 6, 3) && y <= 38, fire.deep);
  flames?.heights.forEach((height, i) => {
    const cx = 12 + i * 4;
    fillShape(c, (x, y) => insideEllipse(x, y, cx, 37 - height / 2, 2, height / 2 + 1), fire.deep);
    fillShape(c, (x, y) => insideEllipse(x, y, cx, 37 - height / 3, 1, height / 3 + 1), fire.mid);
  });
  fillEllipse(c, 16, 36, 2, 2, fire.bright);
  if (flames?.spark) setPixel(c, flames.spark[0], flames.spark[1], fire.bright);
  fillRect(c, 10, 37, 12, 2, PALETTE.bark.outline); // logs
  // A candle and a picture frame on the mantle.
  fillRect(c, 5, 0, 2, 4, PALETTE.cabin.shine);
  setPixel(c, 5, 0, fire.bright);
  return c;
}

/** 48×32 flat over 3×2: a red rug with a patterned border and fringes. */
function rug(): PixelCanvas {
  const c = createPixelCanvas(48, 32);
  const r = PALETTE.rug;
  fillRect(c, 2, 2, 44, 28, r.dark);
  fillRect(c, 4, 4, 40, 24, r.base);
  fillRect(c, 8, 8, 32, 16, r.light);
  fillRect(c, 12, 12, 24, 8, r.base);
  for (let x = 3; x < 46; x += 2) {
    setPixel(c, x, 0, r.light);
    setPixel(c, x, 1, r.light);
    setPixel(c, x, 30, r.light);
    setPixel(c, x, 31, r.light);
  }
  return c;
}

/** 16×24: a leafy plant in a terracotta pot. */
function plant(): PixelCanvas {
  const c = createPixelCanvas(16, 24);
  const leaf = PALETTE.leafy;
  fillEllipse(c, 5, 9, 4, 5, leaf.dark);
  fillEllipse(c, 11, 8, 4, 5, leaf.dark);
  fillEllipse(c, 8, 6, 4, 5, leaf.base);
  fillEllipse(c, 7, 4, 2, 2, leaf.light);
  const pot = PALETTE.terracotta;
  fillRect(c, 3, 14, 10, 10, O);
  fillRect(c, 4, 15, 8, 8, pot.base);
  fillRect(c, 4, 15, 8, 2, pot.light);
  return c;
}

/** 16×32: a standing reading lamp; the shade glows at night. */
function floorLamp(): PixelCanvas {
  const c = createPixelCanvas(16, 32);
  fillRect(c, 3, 2, 10, 9, O);
  fillRect(c, 4, 3, 8, 7, PALETTE.lampShade);
  fillRect(c, 4, 9, 8, 1, PALETTE.thatch.dark);
  fillRect(c, 7, 11, 2, 18, O);
  fillRect(c, 4, 29, 8, 3, O);
  fillRect(c, 5, 29, 6, 2, PALETTE.rock.base);
  return c;
}

export function paintFurnitureSprites(): SpriteSource[] {
  return [
    { key: 'bed', frames: [bed()] },
    { key: 'table', frames: [table()] },
    { key: 'chair', frames: [chair()] },
    { key: 'bookshelf', frames: [bookshelf()] },
    {
      key: 'fireplace',
      frames: Array.from({ length: FIRE_FRAME_COUNT }, (_, frame) => fireplace(frame)),
    },
    { key: 'rug', frames: [rug()] },
    { key: 'plant', frames: [plant()] },
    { key: 'floor_lamp', frames: [floorLamp()] },
  ];
}
