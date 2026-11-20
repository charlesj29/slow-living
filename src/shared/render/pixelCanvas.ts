// A tiny in-memory RGBA image for painting pixel art in code. Pure TypeScript
// (no DOM canvas), so sprite generation runs in tests and workers too.

export type Rgba = readonly [r: number, g: number, b: number, a: number];

export interface PixelCanvas {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

const CHANNELS = 4;
const OPAQUE = 255;
export const TRANSPARENT: Rgba = [0, 0, 0, 0];

export function createPixelCanvas(width: number, height: number): PixelCanvas {
  return { width, height, data: new Uint8ClampedArray(width * height * CHANNELS) };
}

/** Parses `#rrggbb`. */
export function hexToRgba(hex: string, alpha = OPAQUE): Rgba {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff, alpha];
}

/** Writes one pixel; coordinates outside the canvas are ignored, which keeps shape code simple. */
export function setPixel(canvas: PixelCanvas, x: number, y: number, color: Rgba): void {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
  const offset = (Math.floor(y) * canvas.width + Math.floor(x)) * CHANNELS;
  canvas.data[offset] = color[0];
  canvas.data[offset + 1] = color[1];
  canvas.data[offset + 2] = color[2];
  canvas.data[offset + 3] = color[3];
}

export function getPixel(canvas: PixelCanvas, x: number, y: number): Rgba {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return TRANSPARENT;
  const offset = (y * canvas.width + x) * CHANNELS;
  const { data } = canvas;
  return [data[offset] ?? 0, data[offset + 1] ?? 0, data[offset + 2] ?? 0, data[offset + 3] ?? 0];
}

export function isOpaqueAt(canvas: PixelCanvas, x: number, y: number): boolean {
  return getPixel(canvas, x, y)[3] > 0;
}

export function fillRect(
  canvas: PixelCanvas,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Rgba,
): void {
  for (let py = y; py < y + height; py++) {
    for (let px = x; px < x + width; px++) {
      setPixel(canvas, px, py, color);
    }
  }
}

/** Copies `source` onto `target` at (dx, dy). Transparent source pixels are skipped (sprite compositing). */
export function blit(source: PixelCanvas, target: PixelCanvas, dx: number, dy: number): void {
  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      const color = getPixel(source, x, y);
      if (color[3] > 0) setPixel(target, dx + x, dy + y, color);
    }
  }
}

/** Rotates a square or rectangular canvas 90° clockwise. */
export function rotate90(canvas: PixelCanvas): PixelCanvas {
  const rotated = createPixelCanvas(canvas.height, canvas.width);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      setPixel(rotated, canvas.height - 1 - y, x, getPixel(canvas, x, y));
    }
  }
  return rotated;
}

export function rotateTimes(canvas: PixelCanvas, quarterTurns: number): PixelCanvas {
  let result = canvas;
  for (let i = 0; i < ((quarterTurns % 4) + 4) % 4; i++) result = rotate90(result);
  return result;
}
