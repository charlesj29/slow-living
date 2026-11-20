// Clump shading for leafy and rounded things (trees, bushes, rocks): the shape
// is a union of circles drawn back to front. Each pixel is shaded by its own
// clump's surface (lit from the top-left), with a dark crease where a clump
// in front overlaps one behind, and a dark outline around the whole shape —
// the classic chunky look of handheld pixel art.
import { setPixel, type PixelCanvas } from '@/shared/render/pixelCanvas';
import type { Ramp } from './palette';

export interface Clump {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
}

// Light comes from the top-left; these weight how much x and y face the light.
const LIGHT_X = 0.55;
const LIGHT_Y = 0.85;
const HIGHLIGHT_LEVEL = 0.62;
const LIGHT_LEVEL = 0.22;
const DARK_LEVEL = -0.38;

function ownerAt(clumps: readonly Clump[], x: number, y: number): number {
  for (let i = clumps.length - 1; i >= 0; i--) {
    const clump = clumps[i];
    if (clump && Math.hypot(x + 0.5 - clump.cx, y + 0.5 - clump.cy) <= clump.r) return i;
  }
  return -1;
}

export function paintClumps(canvas: PixelCanvas, clumps: readonly Clump[], tones: Ramp): void {
  const owners = new Int16Array(canvas.width * canvas.height).fill(-1);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) owners[y * canvas.width + x] = ownerAt(clumps, x, y);
  }
  const owner = (x: number, y: number): number =>
    x < 0 || y < 0 || x >= canvas.width || y >= canvas.height
      ? -1
      : (owners[y * canvas.width + x] ?? -1);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const own = owner(x, y);
      if (own < 0) continue;
      const neighbors = [owner(x - 1, y), owner(x + 1, y), owner(x, y - 1), owner(x, y + 1)];
      if (neighbors.some((n) => n < 0)) {
        setPixel(canvas, x, y, tones.outline);
        continue;
      }
      if (neighbors.some((n) => n > own)) {
        setPixel(canvas, x, y, tones.dark); // crease under a clump in front
        continue;
      }
      const clump = clumps[own];
      if (!clump) continue;
      const nx = (x + 0.5 - clump.cx) / clump.r;
      const ny = (y + 0.5 - clump.cy) / clump.r;
      const lit = -(nx * LIGHT_X + ny * LIGHT_Y);
      let tone = tones.base;
      if (lit > HIGHLIGHT_LEVEL) tone = (x + y) % 2 === 0 ? tones.highlight : tones.light;
      else if (lit > LIGHT_LEVEL) tone = tones.light;
      else if (lit < DARK_LEVEL) tone = tones.dark;
      // A sparse, regular leaf texture on the mid tones keeps big areas lively.
      else if ((x * 3 + y * 5) % 11 === 0) tone = tones.dark;
      setPixel(canvas, x, y, tone);
    }
  }
}

/** The overall rounded shape of a crown: an ellipse in sprite pixels. */
export interface CrownShape {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
}

export interface LeafClusterOptions {
  /** Radius of one leaf cluster in pixels. */
  readonly clusterRadius: number;
  /** Distance between cluster centres inside the crown. */
  readonly spacing: number;
  /** Clusters around the rim, which give the scalloped silhouette. */
  readonly rimClusters: number;
}

interface Random {
  range: (min: number, max: number) => number;
}

/**
 * Many small leaf clusters filling a crown: a jittered grid inside plus a ring
 * around the rim. Sorted top to bottom so lower clusters overlap the ones
 * behind them (they are nearer the viewer in a 3/4 top-down view).
 */
export function leafClusters(shape: CrownShape, options: LeafClusterOptions, rng: Random): Clump[] {
  const { clusterRadius: r, spacing, rimClusters } = options;
  const clumps: Clump[] = [];
  for (let y = shape.cy - shape.ry + r; y <= shape.cy + shape.ry - r; y += spacing) {
    for (let x = shape.cx - shape.rx + r; x <= shape.cx + shape.rx - r; x += spacing) {
      const cx = x + rng.range(-spacing * 0.3, spacing * 0.3);
      const cy = y + rng.range(-spacing * 0.3, spacing * 0.3);
      const inside =
        ((cx - shape.cx) / (shape.rx - r)) ** 2 + ((cy - shape.cy) / (shape.ry - r)) ** 2;
      if (inside <= 1) clumps.push({ cx, cy, r: r * rng.range(0.85, 1.15) });
    }
  }
  for (let i = 0; i < rimClusters; i++) {
    const angle = (i / rimClusters) * Math.PI * 2 + rng.range(-0.2, 0.2);
    clumps.push({
      cx: shape.cx + Math.cos(angle) * (shape.rx - r * 0.75),
      cy: shape.cy + Math.sin(angle) * (shape.ry - r * 0.75),
      r: r * rng.range(0.9, 1.2),
    });
  }
  return clumps.sort((a, b) => a.cy - b.cy);
}

// Crown lighting: each cluster's own roundness plus the whole crown's form.
const CLUSTER_WEIGHT = 0.95;
const CROWN_WEIGHT = 0.65;
const CROWN_HIGHLIGHT = 0.95;
const CROWN_LIGHT = 0.35;
const CROWN_DARK = -0.4;
const CROWN_DEEP = -1.1;

/**
 * Shades a crown of leaf clusters: lit from the top-left at two scales (each
 * cluster and the whole crown), dark creases where a cluster in front
 * overlaps one behind, deep shade low on the right, a coloured outline.
 */
export function paintLeafCrown(
  canvas: PixelCanvas,
  clumps: readonly Clump[],
  shape: CrownShape,
  tones: Ramp,
): void {
  const owners = new Int16Array(canvas.width * canvas.height).fill(-1);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) owners[y * canvas.width + x] = ownerAt(clumps, x, y);
  }
  const owner = (x: number, y: number): number =>
    x < 0 || y < 0 || x >= canvas.width || y >= canvas.height
      ? -1
      : (owners[y * canvas.width + x] ?? -1);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const own = owner(x, y);
      const clump = clumps[own];
      if (own < 0 || !clump) continue;
      const neighbors = [owner(x - 1, y), owner(x + 1, y), owner(x, y - 1), owner(x, y + 1)];
      if (neighbors.some((n) => n < 0)) {
        setPixel(canvas, x, y, tones.outline);
        continue;
      }
      const local =
        ((x + 0.5 - clump.cx) / clump.r) * LIGHT_X + ((y + 0.5 - clump.cy) / clump.r) * LIGHT_Y;
      const global =
        ((x + 0.5 - shape.cx) / shape.rx) * LIGHT_X + ((y + 0.5 - shape.cy) / shape.ry) * LIGHT_Y;
      const lit = -(local * CLUSTER_WEIGHT + global * CROWN_WEIGHT);
      // A clump's underside sits in shadow where the next clump in front begins:
      // that dark line (not outlines all round) is what separates the clumps.
      const below = owner(x, y + 1);
      if (below > own && clumps[below] !== clump) {
        setPixel(canvas, x, y, lit < CROWN_DARK ? tones.outline : tones.dark);
        continue;
      }
      let tone = tones.base;
      if (lit > CROWN_HIGHLIGHT) tone = tones.highlight;
      else if (lit > CROWN_LIGHT) tone = tones.light;
      else if (lit < CROWN_DEEP) tone = tones.outline;
      else if (lit < CROWN_DARK) tone = tones.dark;
      setPixel(canvas, x, y, tone);
    }
  }
}
