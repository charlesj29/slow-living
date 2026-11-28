// Soft round shapes for small cute creatures (birds, the dog, fish), drawn on
// a letter grid and outlined automatically, like the rabbits: plump ellipses,
// rounded strokes and a one-pixel outline round the whole silhouette, so every
// pose stays smooth and chubby. Letters map to colours when turned into a canvas.
import {
  createPixelCanvas,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';

/** A drawing grid: one letter per pixel, '.' is clear. */
export interface SoftGrid {
  readonly width: number;
  readonly height: number;
  readonly cells: string[][];
}

export function softGrid(width: number, height: number): SoftGrid {
  return {
    width,
    height,
    cells: Array.from({ length: height }, () => Array<string>(width).fill('.')),
  };
}

export function put(g: SoftGrid, x: number, y: number, letter: string): void {
  const row = g.cells[Math.round(y)];
  const col = Math.round(x);
  if (row && col >= 0 && col < g.width) row[col] = letter;
}

/** A filled ellipse; with `shade`, its lower-right part (light from the top-left) takes that letter. */
export function ellipse(
  g: SoftGrid,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  letter: string,
  shade?: string,
): void {
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      put(g, x, y, shade && nx * 0.45 + ny > 0.62 ? shade : letter);
    }
  }
}

/** A rounded stroke from (x1, y1) to (x2, y2) with radius r (ears, legs, wings, tails). */
export function capsule(
  g: SoftGrid,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: number,
  letter: string,
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2));
      if (Math.hypot(x - (x1 + dx * t), y - (y1 + dy * t)) <= r) put(g, x, y, letter);
    }
  }
}

/** Every clear pixel touching the shape (4-neighbours) becomes outline ('o'). */
export function outline(g: SoftGrid): void {
  const filled = g.cells.map((row) => row.map((l) => l !== '.'));
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      if (filled[y]?.[x]) continue;
      const near = [filled[y - 1]?.[x], filled[y + 1]?.[x], filled[y]?.[x - 1], filled[y]?.[x + 1]];
      if (near.some(Boolean)) put(g, x, y, 'o');
    }
  }
}

export function softCanvas(g: SoftGrid, colors: Readonly<Record<string, Rgba>>): PixelCanvas {
  const canvas = createPixelCanvas(g.width, g.height);
  g.cells.forEach((row, y) => {
    row.forEach((letter, x) => {
      const color = colors[letter];
      if (letter !== '.' && color) setPixel(canvas, x, y, color);
    });
  });
  return canvas;
}
