// Small shape helpers for painting sprites into a PixelCanvas.
import type { Rng } from '@/shared/engine/random';
import { fillRect, setPixel, type PixelCanvas, type Rgba } from '@/shared/render/pixelCanvas';

export const TILE_PX = 16;

export function fill(canvas: PixelCanvas, color: Rgba): void {
  fillRect(canvas, 0, 0, canvas.width, canvas.height, color);
}

/** Scatters `count` single pixels at random positions inside the rectangle. */
export function speckle(
  canvas: PixelCanvas,
  rng: Rng,
  color: Rgba,
  count: number,
  area = { x: 0, y: 0, width: canvas.width, height: canvas.height },
): void {
  for (let i = 0; i < count; i++) {
    setPixel(
      canvas,
      area.x + rng.int(0, area.width - 1),
      area.y + rng.int(0, area.height - 1),
      color,
    );
  }
}

/** True if pixel centre (x, y) lies inside the ellipse. */
export function insideEllipse(
  x: number,
  y: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): boolean {
  const dx = (x + 0.5 - cx) / rx;
  const dy = (y + 0.5 - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

export function fillEllipse(
  canvas: PixelCanvas,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: Rgba,
): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (insideEllipse(x, y, cx, cy, rx, ry)) setPixel(canvas, x, y, color);
    }
  }
}

/** Paints every pixel for which `inside` is true, darkening the rim with `outline`. */
export function fillShape(
  canvas: PixelCanvas,
  inside: (x: number, y: number) => boolean,
  color: Rgba,
  outline?: Rgba,
): void {
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (!inside(x, y)) continue;
      const onRim =
        !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      setPixel(canvas, x, y, outline && onRim ? outline : color);
    }
  }
}

/** A short horizontal line that wraps around the canvas edge (for seamless water). */
export function wrappedLine(
  canvas: PixelCanvas,
  x: number,
  y: number,
  length: number,
  color: Rgba,
): void {
  for (let i = 0; i < length; i++) {
    setPixel(canvas, (((x + i) % canvas.width) + canvas.width) % canvas.width, y, color);
  }
}
