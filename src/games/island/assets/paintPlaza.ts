// The village plaza: a wooden bench, a market stall with a striped awning and
// crates of produce, and string lights between two thin posts. The bulbs use
// the lamp-shade and flame colours, so they glow (in colour) at night.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  hexToRgba,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';
import { PALETTE } from './palette';

const O = PALETTE.wall.outline;
const WOOD = PALETTE.dock;

/** 32×22 over 2×1: a slatted bench with a back rest. */
function bench(): PixelCanvas {
  const c = createPixelCanvas(32, 22);
  fillRect(c, 1, 2, 30, 8, O); // back rest
  fillRect(c, 2, 3, 28, 2, WOOD.light);
  fillRect(c, 2, 6, 28, 2, WOOD.base);
  fillRect(c, 0, 10, 32, 6, O); // seat
  fillRect(c, 1, 11, 30, 2, WOOD.light);
  fillRect(c, 1, 13, 30, 2, WOOD.dark);
  for (const x of [3, 27]) {
    fillRect(c, x, 16, 3, 6, O);
    fillRect(c, x + 1, 16, 1, 5, WOOD.base);
  }
  return c;
}

/** A crate of round produce (apples, pumpkins, cabbages) seen from the front. */
function crate(c: PixelCanvas, x: number, y: number, fruit: Rgba, shade: Rgba): void {
  fillRect(c, x, y + 3, 12, 7, O);
  fillRect(c, x + 1, y + 4, 10, 5, PALETTE.bark.light);
  fillRect(c, x + 1, y + 6, 10, 1, PALETTE.bark.base);
  for (const fx of [x + 1, x + 4, x + 7]) {
    fillRect(c, fx, y, 4, 4, fruit);
    setPixel(c, fx + 3, y + 3, shade);
    setPixel(c, fx + 1, y, PALETTE.cabin.shine);
  }
}

/** Two fresh loaves at the front of the stall's counter: left x of each, and their top row (sprite pixels). */
export const STALL_LOAVES = { xs: [11, 30], top: 27, width: 7 } as const;
const CRUST = hexToRgba('#c98a4a');
const CRUST_LIGHT = hexToRgba('#e8b070');

/** A little round loaf with two scores across the top. */
function loaf(c: PixelCanvas, x: number, y: number): void {
  fillRect(c, x + 1, y, 5, 1, O);
  fillRect(c, x, y + 1, 7, 2, O);
  fillRect(c, x + 1, y + 1, 5, 2, CRUST);
  setPixel(c, x + 2, y + 1, CRUST_LIGHT);
  setPixel(c, x + 4, y + 1, CRUST_LIGHT);
  fillRect(c, x + 1, y + 3, 5, 1, O);
}

/** 48×44 over 3×1: a counter of produce under a red-and-white striped awning. */
function marketStall(): PixelCanvas {
  const c = createPixelCanvas(48, 44);
  // Poles.
  for (const x of [3, 43]) fillRect(c, x, 8, 2, 36, O);
  // Awning: stripes and a scalloped edge.
  fillRect(c, 0, 4, 48, 11, O);
  for (let x = 1; x < 47; x++) {
    const stripe = Math.floor((x - 1) / 6) % 2 === 0 ? PALETTE.quilt.base : PALETTE.paper.base;
    fillRect(c, x, 5, 1, 8, stripe);
  }
  fillRect(c, 1, 5, 46, 1, PALETTE.quilt.light);
  for (let x = 1; x < 47; x += 6) fillRect(c, x + 1, 13, 4, 2, O);
  fillRect(c, 22, 0, 4, 5, O); // a little sign on top
  fillRect(c, 23, 1, 2, 3, PALETTE.gold.light);
  // Counter with crates on it.
  fillRect(c, 1, 30, 46, 14, O);
  fillRect(c, 2, 31, 44, 12, WOOD.base);
  fillRect(c, 2, 31, 44, 2, WOOD.light);
  for (let x = 8; x < 46; x += 8) fillRect(c, x, 33, 1, 10, WOOD.dark);
  crate(c, 4, 20, PALETTE.flowers.red.petal, PALETTE.quilt.dark);
  crate(c, 18, 20, PALETTE.fire.mid, PALETTE.terracotta.base);
  crate(c, 32, 20, PALETTE.moss.light, PALETTE.moss.base);
  for (const x of STALL_LOAVES.xs) loaf(c, x, STALL_LOAVES.top);
  return c;
}

/** The stall's closed look (night): same size, so it swaps in place. */
export const MARKET_STALL_CLOSED_KEY = 'market_stall_closed';
const CLOTH = {
  base: hexToRgba('#8c9ab0'),
  shade: hexToRgba('#6f7c93'),
  light: hexToRgba('#a9b5c8'),
};

/**
 * The stall closed for the night: the awning rolled up under the sign, the
 * crates under a tied-down cloth, and the loaves taken in.
 */
function marketStallClosed(): PixelCanvas {
  const c = createPixelCanvas(48, 44);
  for (const x of [3, 43]) fillRect(c, x, 8, 2, 36, O);
  // The awning, rolled up into a striped bar.
  fillRect(c, 0, 5, 48, 5, O);
  for (let x = 1; x < 47; x++) {
    const stripe = Math.floor((x - 1) / 6) % 2 === 0 ? PALETTE.quilt.base : PALETTE.paper.base;
    fillRect(c, x, 6, 1, 3, stripe);
  }
  fillRect(c, 1, 6, 46, 1, PALETTE.quilt.light);
  fillRect(c, 22, 1, 4, 5, O); // the sign stays up
  fillRect(c, 23, 2, 2, 3, PALETTE.gold.light);
  // The counter.
  fillRect(c, 1, 30, 46, 14, O);
  fillRect(c, 2, 31, 44, 12, WOOD.base);
  fillRect(c, 2, 31, 44, 2, WOOD.light);
  for (let x = 8; x < 46; x += 8) fillRect(c, x, 33, 1, 10, WOOD.dark);
  // A cloth over the crates, with a couple of folds, tied down at the corners.
  fillRect(c, 3, 20, 42, 11, O);
  fillRect(c, 4, 21, 40, 9, CLOTH.base);
  fillRect(c, 4, 21, 40, 2, CLOTH.light);
  for (const x of [17, 31]) fillRect(c, x, 23, 1, 7, CLOTH.shade);
  for (const x of [4, 43]) fillRect(c, x, 28, 1, 3, O);
  return c;
}

/** 48×40 over 3×1: two thin posts with a sagging string of coloured bulbs. */
function stringLights(): PixelCanvas {
  const c = createPixelCanvas(48, 40);
  for (const x of [2, 45]) {
    fillRect(c, x - 1, 6, 3, 34, O);
    fillRect(c, x, 7, 1, 32, PALETTE.bark.base);
  }
  const bulbs: readonly Rgba[] = [PALETTE.lampShade, PALETTE.fire.bright, PALETTE.fire.mid];
  for (let x = 3; x < 45; x++) {
    // The wire sags in the middle.
    const t = (x - 24) / 21;
    const y = Math.round(16 - 7 * t * t);
    setPixel(c, x, y, O);
    if ((x - 3) % 5 === 2) {
      const bulb = bulbs[Math.floor((x - 3) / 5) % bulbs.length] ?? PALETTE.lampShade;
      fillRect(c, x - 1, y + 1, 3, 3, O);
      setPixel(c, x, y + 2, bulb);
      setPixel(c, x, y + 3, bulb);
    }
  }
  return c;
}

export function paintPlazaSprites(): SpriteSource[] {
  return [
    { key: 'bench', frames: [bench()] },
    { key: 'market_stall', frames: [marketStall()] },
    { key: MARKET_STALL_CLOSED_KEY, frames: [marketStallClosed()] },
    { key: 'string_lights', frames: [stringLights()] },
  ];
}
