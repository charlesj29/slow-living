// Village decorations: the well, haystacks, crates, lamp posts (their lantern
// glass glows at night, like windows) and vegetable-patch tiles.
import { createRng, hashString, type Rng } from '@/shared/engine/random';
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { fillEllipse, fillShape, insideEllipse, TILE_PX } from './paint';
import { PALETTE } from './palette';

/** 32×36 over a 2×1 footprint: a stone well with a little wooden roof and a bucket. */
function well(): PixelCanvas {
  const canvas = createPixelCanvas(32, 36);
  const c = PALETTE.cottage;
  const wood = PALETTE.bark;
  // Stone drum with a rim seen slightly from above.
  fillRect(canvas, 3, 24, 26, 12, PALETTE.wall.outline);
  fillRect(canvas, 4, 25, 24, 10, c.stone);
  for (let y = 25; y < 35; y++) {
    for (let x = 4; x < 28; x++) {
      const row = y - 25;
      const shifted = x + (Math.floor(row / 3) % 2) * 3;
      if (row % 3 === 2 || shifted % 6 === 0) setPixel(canvas, x, y, c.stoneDark);
      else if (row % 3 === 0) setPixel(canvas, x, y, c.stoneLight);
    }
  }
  fillShape(
    canvas,
    (x, y) => insideEllipse(x, y, 16, 24, 13, 3.5),
    c.stoneLight,
    PALETTE.wall.outline,
  );
  fillEllipse(canvas, 16, 24, 9.5, 2, PALETTE.lakeWater.outline);
  // Posts, crossbar, rope and bucket.
  for (const x of [5, 25]) {
    fillRect(canvas, x, 7, 3, 18, wood.outline);
    fillRect(canvas, x + 1, 8, 1, 16, wood.light);
  }
  fillRect(canvas, 6, 11, 21, 2, wood.outline);
  fillRect(canvas, 7, 11, 19, 1, wood.base);
  fillRect(canvas, 16, 13, 1, 5, PALETTE.fence.dark);
  fillRect(canvas, 14, 18, 5, 4, wood.outline);
  fillRect(canvas, 15, 18, 3, 3, wood.base);
  // Roof.
  for (let y = 1; y <= 8; y++) {
    const inset = Math.max(0, 8 - y);
    fillRect(canvas, 1 + inset, y, 30 - 2 * inset, 1, PALETTE.roof.outline);
    if (y > 1 && y < 8) {
      fillRect(
        canvas,
        2 + inset,
        y,
        28 - 2 * inset,
        1,
        y % 2 === 0 ? PALETTE.roof.base : PALETTE.roof.light,
      );
    }
  }
  return canvas;
}

/** 16×20: a tall, domed haystack with straw strokes. */
function haystack(): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX + 4);
  const straw = PALETTE.thatch;
  const inside = (x: number, y: number): boolean => y <= 19 && insideEllipse(x, y, 8, 12, 7.5, 9);
  fillShape(canvas, inside, straw.base, straw.outline);
  for (let y = 4; y < 19; y++) {
    for (let x = 2; x < 14; x++) {
      if (!insideEllipse(x, y, 8, 12, 6.5, 8)) continue;
      if ((x * 3 + y) % 5 === 0) setPixel(canvas, x, y, straw.dark);
      else if (y < 9 && x < 9) setPixel(canvas, x, y, straw.light);
    }
  }
  fillRect(canvas, 1, 19, 14, 1, straw.outline);
  setPixel(canvas, 5, 5, straw.highlight);
  setPixel(canvas, 6, 4, straw.highlight);
  return canvas;
}

/** A wooden crate: plank sides with a cross brace, the lid lit from above. */
function crate(): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const wood = PALETTE.dock;
  fillRect(canvas, 2, 3, 12, 13, wood.outline);
  fillRect(canvas, 3, 4, 10, 3, wood.light); // lid
  fillRect(canvas, 3, 7, 10, 8, wood.base);
  for (const y of [9, 12]) fillRect(canvas, 3, y, 10, 1, wood.dark);
  for (let i = 0; i < 8; i++) setPixel(canvas, 3 + Math.round((i * 9) / 7), 14 - i, wood.dark);
  fillRect(canvas, 3, 7, 10, 1, wood.outline);
  return canvas;
}

/** 16×32: a wooden post with an iron lantern; its glass lights up at night. */
function lampPost(): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX * 2);
  const wood = PALETTE.bark;
  const iron = PALETTE.rock.outline;
  fillRect(canvas, 6, 12, 4, 19, wood.outline);
  fillRect(canvas, 7, 12, 1, 18, wood.light);
  fillRect(canvas, 8, 12, 1, 18, wood.base);
  fillRect(canvas, 4, 29, 8, 3, wood.outline);
  fillRect(canvas, 5, 29, 6, 2, wood.base);
  // Lantern: cap, glass panes (window glass, so it glows at night), base.
  fillRect(canvas, 5, 1, 6, 2, iron);
  fillRect(canvas, 4, 3, 8, 8, iron);
  fillRect(canvas, 5, 4, 6, 6, PALETTE.cabin.glass);
  fillRect(canvas, 7, 4, 2, 6, iron);
  setPixel(canvas, 5, 4, PALETTE.cabin.shine);
  setPixel(canvas, 9, 4, PALETTE.cabin.shine);
  fillRect(canvas, 5, 11, 6, 1, iron);
  return canvas;
}

/** Soil in furrows with a row of crops (cabbages or leafy carrot tops). */
function crops(rng: Rng, cabbage: boolean): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const soil = PALETTE.path;
  fillRect(canvas, 0, 0, TILE_PX, TILE_PX, soil.dark);
  for (const y of [3, 8, 13]) fillRect(canvas, 0, y, TILE_PX, 2, soil.outline);
  const leaf = PALETTE.leafy;
  for (const y of [2, 7, 12]) {
    for (const x of [3, 8, 13]) {
      const cx = x + rng.range(-0.5, 0.5);
      if (cabbage) {
        fillShape(
          canvas,
          (px, py) => insideEllipse(px, py, cx, y + 0.5, 2.2, 1.8),
          leaf.base,
          leaf.outline,
        );
        setPixel(canvas, Math.floor(cx) - 1, y - 1, leaf.highlight);
      } else {
        // A fan of carrot leaves over an orange shoulder.
        const x0 = Math.floor(cx);
        setPixel(canvas, x0 - 1, y - 2, leaf.light);
        setPixel(canvas, x0 + 1, y - 2, leaf.light);
        setPixel(canvas, x0, y - 2, leaf.highlight);
        setPixel(canvas, x0 - 1, y - 1, leaf.base);
        setPixel(canvas, x0, y - 1, leaf.light);
        setPixel(canvas, x0 + 1, y - 1, leaf.base);
        setPixel(canvas, x0, y, PALETTE.terracotta.light);
        setPixel(canvas, x0 + 1, y, PALETTE.terracotta.base);
      }
    }
  }
  return canvas;
}

export function paintVillagePropSprites(): SpriteSource[] {
  return [
    { key: 'well', frames: [well()] },
    { key: 'haystack', frames: [haystack()] },
    { key: 'crate', frames: [crate()] },
    { key: 'lamp_post', frames: [lampPost()] },
    { key: 'crops.0', frames: [crops(createRng(hashString('crops.0')), true)] },
    { key: 'crops.1', frames: [crops(createRng(hashString('crops.1')), false)] },
  ];
}
