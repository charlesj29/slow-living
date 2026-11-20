// Natural objects. Standing sprites keep their base on the bottom row:
// big trees 32×32 and giant forest trees 48×48 (crowns over their 2-tile
// trunk footprint), small trees 16×32, bushes and rocks 16×16. Leafy crowns
// are built from many small leaf clusters. Flowers sway (4-frame strips).
import { createRng, hashString, type Rng } from '@/shared/engine/random';
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';
import {
  leafClusters,
  paintClumps,
  paintLeafCrown,
  type Clump,
  type CrownShape,
  type LeafClusterOptions,
} from './foliage';
import { TILE_PX } from './paint';
import { PALETTE } from './palette';

/** Frames in every animated object strip (one counter drives them all). */
export const FLOWER_FRAME_COUNT = 4;
/** Flower head offsets per frame: rest, lean right, rest, lean left. */
const SWAY_OFFSETS = [0, 1, 0, -1] as const;

const rngFor = (key: string): Rng => createRng(hashString(key));

/** Jitters clump centres a little so variants of the same tree differ. */
function jitter(clumps: readonly Clump[], rng: Rng, amount: number): Clump[] {
  return clumps.map((clump) => ({
    cx: clump.cx + rng.range(-amount, amount),
    cy: clump.cy + rng.range(-amount, amount),
    r: clump.r + rng.range(-amount / 2, amount / 2),
  }));
}

/** A trunk with a lit left side, shaded right side, outline and flared roots. */
function paintTrunk(
  canvas: PixelCanvas,
  left: number,
  top: number,
  width: number,
  bottom: number,
): void {
  const { outline, dark, base, light } = PALETTE.bark;
  fillRect(canvas, left - 1, top, width + 2, bottom - top + 1, outline);
  fillRect(canvas, left, top, width, bottom - top, base);
  fillRect(canvas, left, top, 1, bottom - top, light);
  fillRect(canvas, left + width - 1, top, 1, bottom - top, dark);
  setPixel(canvas, left - 2, bottom, outline);
  setPixel(canvas, left + width + 1, bottom, outline);
}

/** Round broadleaf crown over a short trunk, sized to the canvas. */
function broadleafTree(
  rng: Rng,
  size: { readonly width: number; readonly height: number },
  crown: CrownShape,
  clusters: LeafClusterOptions,
  trunk: { readonly left: number; readonly width: number; readonly top: number },
): PixelCanvas {
  const canvas = createPixelCanvas(size.width, size.height);
  paintTrunk(canvas, trunk.left, trunk.top, trunk.width, size.height - 2);
  paintLeafCrown(canvas, leafClusters(crown, clusters, rng), crown, PALETTE.oak);
  return canvas;
}

function bigOak(rng: Rng): PixelCanvas {
  return broadleafTree(
    rng,
    { width: TILE_PX * 2, height: TILE_PX * 2 },
    { cx: 16, cy: 12, rx: 15, ry: 11.5 },
    { clusterRadius: 4.5, spacing: 6, rimClusters: 10 },
    { left: 13, width: 6, top: 21 },
  );
}

/** The big forest tree: a 48×48 crown that spreads past its 2-tile trunk footprint. */
function giantTree(rng: Rng): PixelCanvas {
  return broadleafTree(
    rng,
    { width: TILE_PX * 3, height: TILE_PX * 3 },
    { cx: 24, cy: 18, rx: 23, ry: 17 },
    { clusterRadius: 5.5, spacing: 7, rimClusters: 14 },
    { left: 20, width: 8, top: 32 },
  );
}

/** Stacked tiers of leaf clusters, widening downwards, shaded as one cone. */
function bigPine(rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX * 2, TILE_PX * 2);
  paintTrunk(canvas, 14, 24, 4, 30);
  const tiers: Clump[] = [{ cx: 16, cy: 2.5, r: 2.5 }];
  const rows = [
    { y: 5, half: 3, r: 3 },
    { y: 9.5, half: 6, r: 3.5 },
    { y: 14, half: 9, r: 4 },
    { y: 19, half: 11.5, r: 4.5 },
  ];
  for (const row of rows) {
    const count = Math.max(2, Math.round(row.half / 2.2));
    for (let i = 0; i <= count; i++) {
      tiers.push({
        cx: 16 - row.half + (i / count) * row.half * 2 + rng.range(-0.5, 0.5),
        cy: row.y + rng.range(-0.4, 0.4),
        r: row.r,
      });
    }
  }
  paintLeafCrown(canvas, tiers, { cx: 16, cy: 12, rx: 12, ry: 12 }, PALETTE.pine);
  return canvas;
}

function smallTree(rng: Rng): PixelCanvas {
  return broadleafTree(
    rng,
    { width: TILE_PX, height: TILE_PX * 2 },
    { cx: 8, cy: 10, rx: 7.5, ry: 8 },
    { clusterRadius: 3, spacing: 4, rimClusters: 8 },
    { left: 7, width: 3, top: 17 },
  );
}

function bush(rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const crown: CrownShape = { cx: 8, cy: 9.5, rx: 7.5, ry: 6 };
  const clumps = leafClusters(crown, { clusterRadius: 3, spacing: 4, rimClusters: 8 }, rng);
  paintLeafCrown(canvas, clumps, crown, PALETTE.leafy);
  return canvas;
}

function rock(rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const clumps: Clump[] = [
    { cx: 6, cy: 9.5, r: 4.5 },
    { cx: 10.5, cy: 10.5, r: 4.5 },
    { cx: 8, cy: 8.5, r: 4.5 },
  ];
  paintClumps(canvas, jitter(clumps, rng, 0.5), PALETTE.rock);
  return canvas;
}

interface FlowerColors {
  readonly petal: Rgba;
  readonly shade: Rgba;
}

/** Three plus-shaped flowers on short stems; heads sway one pixel per frame. */
function flowerFrames(colors: FlowerColors, center: Rgba, rng: Rng): PixelCanvas[] {
  const spots = [
    { x: rng.int(3, 5), y: rng.int(4, 6) },
    { x: rng.int(10, 12), y: rng.int(3, 5) },
    { x: rng.int(6, 9), y: rng.int(10, 11) },
  ];
  return SWAY_OFFSETS.map((sway) => {
    const canvas = createPixelCanvas(TILE_PX, TILE_PX);
    for (const { x, y } of spots) {
      setPixel(canvas, x - 1, y + 3, PALETTE.grass.dark);
      setPixel(canvas, x + 1, y + 3, PALETTE.grass.dark);
      setPixel(canvas, x, y + 3, PALETTE.stem);
      setPixel(canvas, x + sway, y + 2, PALETTE.stem);
      const hx = x + sway;
      setPixel(canvas, hx - 1, y, colors.petal);
      setPixel(canvas, hx, y - 1, colors.petal);
      setPixel(canvas, hx + 1, y, colors.shade);
      setPixel(canvas, hx, y + 1, colors.shade);
      setPixel(canvas, hx, y, center);
    }
    return canvas;
  });
}

function grassTuft(rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const { outline, dark, light } = PALETTE.grass;
  const blades: readonly (readonly [number, number])[] = [
    [-2, 2],
    [-1, 3],
    [0, 4],
    [1, 3],
    [2, 2],
  ];
  for (let i = 0; i < 2; i++) {
    const x = rng.int(3, 11);
    const y = rng.int(8, 13);
    for (const [dx, height] of blades) {
      for (let h = 0; h < height; h++) {
        const tone = h === height - 1 ? light : h === 0 ? outline : dark;
        setPixel(canvas, x + dx, y - h, tone);
      }
    }
  }
  return canvas;
}

function variants(key: string, count: number, paint: (rng: Rng) => PixelCanvas): SpriteSource[] {
  return Array.from({ length: count }, (_, i) => {
    const variantKey = `${key}.${String(i)}`;
    return { key: variantKey, frames: [paint(rngFor(variantKey))] };
  });
}

function flowers(key: string, colors: FlowerColors, center: Rgba): SpriteSource {
  return { key, frames: flowerFrames(colors, center, rngFor(key)) };
}

export function paintObjectSprites(): SpriteSource[] {
  const f = PALETTE.flowers;
  return [
    ...variants('tree_oak', 3, bigOak),
    ...variants('tree_giant', 2, giantTree),
    ...variants('tree_pine', 2, bigPine),
    ...variants('tree_small', 2, smallTree),
    ...variants('bush', 3, bush),
    ...variants('rock', 2, rock),
    flowers('flower_red', f.red, f.centerWarm),
    flowers('flower_yellow', f.yellow, f.centerDark),
    flowers('flower_blue', f.blue, PALETTE.foam.bright),
    flowers('flower_white', f.white, f.centerWarm),
    { key: 'grass_tuft', frames: [grassTuft(rngFor('grass_tuft'))] },
  ];
}
