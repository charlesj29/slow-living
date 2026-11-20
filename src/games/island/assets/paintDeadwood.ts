// Woodland litter (16×16): tree stumps (standing, with rings on the cut) and
// fallen branches (flat on the grass, a few leaves still on).
import { createRng, hashString, type Rng } from '@/shared/engine/random';
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';
import { fillEllipse, fillShape, insideEllipse, TILE_PX } from './paint';
import { PALETTE } from './palette';

const VARIANTS = 2;

function stump(rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const bark = PALETTE.bark;
  const wood = PALETTE.heartwood;
  const flare = rng.int(0, 1);
  // Trunk with roots spreading at the base.
  const insideTrunk = (x: number, y: number): boolean => {
    if (y < 8 || y > 15) return false;
    const spread = y >= 14 ? 2 + flare : y >= 13 ? 1 : 0;
    return x >= 4 - spread && x <= 11 + spread;
  };
  fillShape(canvas, insideTrunk, bark.base, bark.outline);
  for (let y = 9; y <= 14; y++) {
    setPixel(canvas, 5, y, bark.light);
    setPixel(canvas, 10, y, bark.dark);
    if ((y + flare) % 3 === 0) setPixel(canvas, 8, y, bark.dark);
  }
  // The cut, seen from above: pale wood with a ring and a darker heart.
  fillShape(canvas, (x, y) => insideEllipse(x, y, 8, 7.5, 4.5, 2.6), wood.base, bark.outline);
  fillShape(canvas, (x, y) => insideEllipse(x, y, 8, 7.5, 2.6, 1.4), wood.base, wood.dark);
  setPixel(canvas, 7, 7, wood.dark);
  setPixel(canvas, 5, 6, wood.highlight);
  setPixel(canvas, 6, 6, wood.light);
  return canvas;
}

function line(canvas: PixelCanvas, x0: number, y0: number, x1: number, y1: number, c: Rgba): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    setPixel(canvas, Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), c);
  }
}

function branch(rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const bark = PALETTE.bark;
  const leaf = PALETTE.leafy;
  const startY = rng.int(10, 12);
  const endY = rng.int(4, 6);
  // Lit from the top-left: light upper edge, dark underside.
  line(canvas, 2, startY + 1, 13, endY + 1, bark.outline);
  line(canvas, 2, startY, 13, endY, bark.base);
  line(canvas, 3, startY - 1, 12, endY - 1, bark.light);
  const forkX = rng.int(6, 8);
  const forkY = Math.round(startY + ((endY - startY) * (forkX - 2)) / 11);
  line(canvas, forkX, forkY + 1, forkX + 3, forkY + 4, bark.outline);
  line(canvas, forkX, forkY, forkX + 3, forkY + 3, bark.base);
  for (const { cx, cy } of [
    { cx: 13.5, cy: endY - 0.5 },
    { cx: forkX + 3.5, cy: forkY + 4 },
  ]) {
    fillEllipse(canvas, cx, cy, 1.8, 1.4, leaf.dark);
    setPixel(canvas, Math.floor(cx) - 1, Math.floor(cy) - 1, leaf.light);
  }
  return canvas;
}

function variants(key: string, paint: (rng: Rng) => PixelCanvas): SpriteSource[] {
  return Array.from({ length: VARIANTS }, (_, i) => {
    const variantKey = `${key}.${String(i)}`;
    return { key: variantKey, frames: [paint(createRng(hashString(variantKey)))] };
  });
}

export function paintDeadwoodSprites(): SpriteSource[] {
  return [...variants('stump', stump), ...variants('branch', branch)];
}
