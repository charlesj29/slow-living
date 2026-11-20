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
