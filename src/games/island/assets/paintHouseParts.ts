// Building parts shared by the village houses and the studio: wall materials,
// windows, doors, a stone base and chimneys. Light comes from the top-left.
// Window glass glows at night (paintLights).
import { fillRect, setPixel, type PixelCanvas, type Rgba } from '@/shared/render/pixelCanvas';
import { PALETTE } from './palette';

export const O = PALETTE.wall.outline;
const C = PALETTE.cottage;

export interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

const width = (b: Box): number => b.right - b.left + 1;
const height = (b: Box): number => b.bottom - b.top + 1;

/** Stone blocks, staggered, with darker mortar and lit tops. */
export function stoneWall(c: PixelCanvas, b: Box): void {
  for (let y = b.top; y <= b.bottom; y++) {
    const row = y - b.top;
    for (let x = b.left; x <= b.right; x++) {
      const shifted = x + (Math.floor(row / 5) % 2) * 4;
      const color =
        row % 5 === 4 || shifted % 8 === 0 ? C.stoneDark : row % 5 === 0 ? C.stoneLight : C.stone;
      setPixel(c, x, y, color);
    }
  }
}

/** Horizontal logs with lit tops, dark seams and round log ends at the corners. */
export function logWall(c: PixelCanvas, b: Box): void {
  for (let y = b.top; y <= b.bottom; y++) {
    const band = (y - b.top) % 4;
    const color =
      band === 3 ? PALETTE.bark.outline : band === 0 ? PALETTE.bark.light : PALETTE.bark.base;
    fillRect(c, b.left, y, width(b), 1, color);
  }
  for (let y = b.top; y <= b.bottom - 2; y += 4) {
    for (const x of [b.left, b.right]) {
      setPixel(c, x, y + 1, PALETTE.heartwood.base);
      setPixel(c, x, y + 2, PALETTE.heartwood.dark);
    }
  }
}

/** Smooth painted wall in one colour, with a few lighter flecks. */
export function paintedWall(c: PixelCanvas, b: Box, base: Rgba, fleck: Rgba): void {
  fillRect(c, b.left, b.top, width(b), height(b), base);
  for (let y = b.top; y <= b.bottom; y++) {
    for (let x = b.left; x <= b.right; x++) {
      if ((x * 5 + y * 11) % 37 === 0) setPixel(c, x, y, fleck);
    }
  }
}

/** Outline on the left and right edges of a wall. */
export function wallEdges(c: PixelCanvas, b: Box): void {
  fillRect(c, b.left - 1, b.top, 1, height(b), O);
  fillRect(c, b.right + 1, b.top, 1, height(b), O);
}

/** A glazed window with a cross frame; optional shutters and flower box. */
export function windowAt(
  c: PixelCanvas,
  left: number,
  top: number,
  size: number,
  options: { readonly shutters?: boolean; readonly flowers?: boolean } = {},
): void {
  fillRect(c, left - 1, top - 1, size + 2, size + 2, O);
  fillRect(c, left, top, size, size, PALETTE.cabin.glass);
  fillRect(c, left, top, size, 1, C.frame);
  fillRect(c, left + Math.floor(size / 2), top, 1, size, C.frame);
  fillRect(c, left, top + Math.floor(size / 2), size, 1, C.frame);
  setPixel(c, left + 1, top + 1, PALETTE.cabin.shine);
  setPixel(c, left + 2, top + 1, PALETTE.cabin.shine);
  if (options.shutters) {
    for (const x of [left - 4, left + size + 1]) {
      fillRect(c, x, top - 1, 3, size + 2, C.shutter);
      fillRect(c, x, top - 1, 3, 1, C.shutterLight);
      fillRect(c, x + 1, top + 1, 1, size - 2, C.shutterDark);
    }
  }
  if (options.flowers) {
    fillRect(c, left - 1, top + size + 1, size + 2, 3, C.box);
    fillRect(c, left - 1, top + size + 3, size + 2, 1, C.boxDark);
    const blooms: readonly Rgba[] = [
      PALETTE.flowers.red.petal,
      PALETTE.flowers.yellow.petal,
      PALETTE.flowers.white.petal,
    ];
    for (let x = left; x < left + size; x += 3) {
      setPixel(c, x + 1, top + size, PALETTE.grass.dark);
      setPixel(c, x, top + size, blooms[(x - left) % blooms.length] ?? C.box);
    }
  } else {
    fillRect(c, left - 2, top + size + 1, size + 4, 1, C.boxDark); // a sill
  }
}

/** A round window (porthole style) centred on (cx, cy). */
export function roundWindow(c: PixelCanvas, cx: number, cy: number, r: number): void {
  for (let y = -r - 1; y <= r + 1; y++) {
    for (let x = -r - 1; x <= r + 1; x++) {
      const d = Math.hypot(x, y);
      if (d <= r + 1.2) setPixel(c, cx + x, cy + y, d > r - 0.2 ? O : PALETTE.cabin.glass);
    }
  }
  fillRect(c, cx - r, cy, r * 2 + 1, 1, C.frame);
  fillRect(c, cx, cy - r, 1, r * 2 + 1, C.frame);
  setPixel(c, cx - 2, cy - 2, PALETTE.cabin.shine);
}

/** A plank door (12 wide) with a frame, standing on `bottom`. */
export function plankDoor(
  c: PixelCanvas,
  centerX: number,
  bottom: number,
  options: { readonly height?: number; readonly color?: Rgba } = {},
): void {
  const h = options.height ?? 18;
  const left = centerX - 6;
  const top = bottom - h;
  fillRect(c, left - 2, top - 2, 16, h + 2, C.beam);
  fillRect(c, left - 1, top - 1, 14, h + 1, O);
  fillRect(c, left, top, 12, h, options.color ?? PALETTE.cabin.door);
  for (const x of [left + 3, left + 6, left + 9]) {
    fillRect(c, x, top + 1, 1, h - 1, PALETTE.cabin.doorDark);
  }
  setPixel(c, left + 9, top + Math.floor(h / 2) + 1, PALETTE.flowers.centerWarm);
}

/** A stone base along the bottom, with a step in front of the door. */
export function stoneBase(
  c: PixelCanvas,
  left: number,
  right: number,
  top: number,
  bottom: number,
  doorX: number,
): void {
  fillRect(c, left, top, right - left + 1, bottom - top + 1, C.stoneDark);
  for (let y = top; y < bottom; y += 4) {
    const offset = ((y - top) / 4) % 2 === 0 ? 0 : 4;
    for (let x = left + 1 + offset; x < right; x += 8) {
      fillRect(c, x, y, 7, 3, C.stone);
      fillRect(c, x, y, 7, 1, C.stoneLight);
    }
  }
  fillRect(c, doorX - 9, top, 18, 3, C.stoneDark);
  fillRect(c, doorX - 8, top, 16, 2, C.stone);
  fillRect(c, doorX - 8, top, 16, 1, C.stoneLight);
}

/** A stone chimney stack (8 wide); returns its top centre (where smoke leaves). */
export function stoneChimney(
  c: PixelCanvas,
  left: number,
  top: number,
  stackHeight: number,
  outline: Rgba = O,
): { x: number; y: number } {
  fillRect(c, left - 1, top - 1, 10, stackHeight + 2, outline);
  fillRect(c, left, top, 8, stackHeight, C.stone);
  fillRect(c, left, top, 8, 2, C.stoneLight);
  for (let y = top + 4; y < top + stackHeight; y += 4) fillRect(c, left, y, 8, 1, C.stoneDark);
  fillRect(c, left + 6, top + 2, 2, stackHeight - 2, C.stoneDark);
  return { x: left + 4, y: top - 1 };
}

/** Roof rows of tiles/shingles with staggered seams, between two x edges per row. */
export function shingleRows(
  c: PixelCanvas,
  top: number,
  bottom: number,
  edges: (y: number) => readonly [left: number, right: number],
  ramp: { readonly dark: Rgba; readonly base: Rgba; readonly light: Rgba; readonly outline: Rgba },
): void {
  for (let y = top; y <= bottom; y++) {
    const [left, right] = edges(y);
    const row = (y - top) % 5;
    fillRect(
      c,
      left,
      y,
      right - left + 1,
      1,
      row === 0 ? ramp.light : row === 4 ? ramp.dark : ramp.base,
    );
    if (row > 0 && row < 4) {
      const offset = Math.floor((y - top) / 5) % 2 === 0 ? 3 : 7;
      for (let x = left + offset; x <= right; x += 8) setPixel(c, x, y, ramp.dark);
    }
    setPixel(c, left, y, ramp.outline);
    setPixel(c, right, y, ramp.outline);
  }
  const [bl, br] = edges(bottom);
  fillRect(c, bl, bottom + 1, br - bl + 1, 1, ramp.outline);
  const [tl, tr] = edges(top);
  fillRect(c, tl, top - 1, tr - tl + 1, 1, ramp.outline);
}
