// Object sprites: trees (16×32, crown above the trunk tile), flowers, grass
// tufts and rocks (16×16). Feet are always on the bottom row of the sprite.
import { createRng, hashString, type Rng } from '@/shared/engine/random';
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';
import { fillEllipse, fillShape, insideEllipse, TILE_PX } from './paint';
import { PALETTE } from './palette';

const TREE_HEIGHT_PX = TILE_PX * 2;

function oakTree(rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TREE_HEIGHT_PX);
  const { base, light, dark, outline } = PALETTE.oak;
  fillEllipse(canvas, 8, 30.5, 6, 1.6, PALETTE.shadow);
  fillRect(canvas, 6, 20, 4, 10, PALETTE.bark.base);
  fillRect(canvas, 9, 20, 1, 10, PALETTE.bark.dark);
  setPixel(canvas, 5, 29, PALETTE.bark.dark);
  setPixel(canvas, 10, 29, PALETTE.bark.dark);
  // Crown: a big blob plus three bumps so the silhouette isn't a plain circle.
  const lobes = [
    { cx: 8, cy: 13, rx: 7.8, ry: 7.2 },
    { cx: 4, cy: 17, rx: 4, ry: 4.2 },
    { cx: 12, cy: 17, rx: 4, ry: 4.2 },
    { cx: 8, cy: 6.5, rx: 5, ry: 4 },
  ];
  const inCrown = (x: number, y: number): boolean =>
    lobes.some((l) => insideEllipse(x, y, l.cx, l.cy, l.rx, l.ry));
  fillShape(canvas, inCrown, base, outline);
  for (let y = 0; y < 22; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      if (!inCrown(x, y) || !inCrown(x, y + 1) || !inCrown(x - 1, y)) continue;
      if (insideEllipse(x, y, 6, 9, 4.5, 4) && rng.chance(0.7)) setPixel(canvas, x, y, light);
      else if (y > 15 && rng.chance(0.5)) setPixel(canvas, x, y, dark);
    }
  }
  return canvas;
}

function pineTree(rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TREE_HEIGHT_PX);
  const { base, light, dark, outline } = PALETTE.pine;
  fillEllipse(canvas, 8, 30.5, 5, 1.5, PALETTE.shadow);
  fillRect(canvas, 7, 22, 3, 8, PALETTE.bark.base);
  fillRect(canvas, 9, 22, 1, 8, PALETTE.bark.dark);
  // Three stacked tiers, each a triangle wider than the one above.
  const tiers = [
    { top: 1, bottom: 10, halfWidth: 4 },
    { top: 6, bottom: 16, halfWidth: 6 },
    { top: 11, bottom: 24, halfWidth: 7.5 },
  ];
  const inTree = (x: number, y: number): boolean =>
    tiers.some((t) => {
      if (y < t.top || y > t.bottom) return false;
      const half = ((y - t.top + 1) / (t.bottom - t.top + 1)) * t.halfWidth;
      return Math.abs(x + 0.5 - 8) <= half;
    });
  fillShape(canvas, inTree, base, outline);
  for (let y = 0; y < 25; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      if (!inTree(x, y) || !inTree(x - 1, y) || !inTree(x + 1, y)) continue;
      if (x < 8 && rng.chance(0.35)) setPixel(canvas, x, y, light);
      else if (x > 9 && rng.chance(0.35)) setPixel(canvas, x, y, dark);
    }
  }
  return canvas;
}

function flowers(petal: Rgba, center: Rgba, rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const spots = [
    { x: rng.int(2, 5), y: rng.int(3, 6) },
    { x: rng.int(9, 12), y: rng.int(2, 5) },
    { x: rng.int(5, 9), y: rng.int(9, 12) },
  ];
  for (const { x, y } of spots) {
    setPixel(canvas, x, y + 2, PALETTE.stem);
    setPixel(canvas, x, y + 3, PALETTE.stem);
    setPixel(canvas, x - 1, y, petal);
    setPixel(canvas, x + 1, y, petal);
    setPixel(canvas, x, y - 1, petal);
    setPixel(canvas, x, y + 1, petal);
    setPixel(canvas, x, y, center);
  }
  return canvas;
}

function grassTuft(rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  for (let i = 0; i < 2; i++) {
    const x = rng.int(3, 11);
    const y = rng.int(7, 13);
    for (const [dx, height] of [
      [-2, 2],
      [-1, 3],
      [0, 4],
      [1, 3],
      [2, 2],
    ] as const) {
      for (let h = 0; h < height; h++) {
        setPixel(
          canvas,
          x + dx,
          y - h,
          h === height - 1 ? PALETTE.grass.blade : PALETTE.grass.dark,
        );
      }
    }
  }
  return canvas;
}

function rock(rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const { base, light, dark, outline } = PALETTE.rock;
  fillEllipse(canvas, 8, 14, 6.5, 1.8, PALETTE.shadow);
  const inRock = (x: number, y: number): boolean =>
    insideEllipse(x, y, 8, 10, 6, 4.5) || insideEllipse(x, y, 6.5, 7.5, 3.5, 3);
  fillShape(canvas, inRock, base, outline);
  for (let y = 0; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      if (!inRock(x, y) || !inRock(x, y - 1) || !inRock(x - 1, y)) continue;
      if (insideEllipse(x, y, 6, 7.5, 2.8, 2)) setPixel(canvas, x, y, light);
      else if (y > 10 && rng.chance(0.6)) setPixel(canvas, x, y, dark);
    }
  }
  return canvas;
}

const rngFor = (key: string): Rng => createRng(hashString(key));

export function paintObjectSprites(): SpriteSource[] {
  const { flowers: f } = PALETTE;
  return [
    { key: 'tree_oak.0', frames: [oakTree(rngFor('tree_oak.0'))] },
    { key: 'tree_oak.1', frames: [oakTree(rngFor('tree_oak.1'))] },
    { key: 'tree_pine.0', frames: [pineTree(rngFor('tree_pine.0'))] },
    { key: 'tree_pine.1', frames: [pineTree(rngFor('tree_pine.1'))] },
    { key: 'flower_red', frames: [flowers(f.red, f.centerWarm, rngFor('flower_red'))] },
    { key: 'flower_yellow', frames: [flowers(f.yellow, f.centerDark, rngFor('flower_yellow'))] },
    { key: 'flower_blue', frames: [flowers(f.blue, f.white, rngFor('flower_blue'))] },
    { key: 'flower_white', frames: [flowers(f.white, f.centerWarm, rngFor('flower_white'))] },
    { key: 'grass_tuft', frames: [grassTuft(rngFor('grass_tuft'))] },
    { key: 'rock.0', frames: [rock(rngFor('rock.0'))] },
    { key: 'rock.1', frames: [rock(rngFor('rock.1'))] },
  ];
}
