// The Developer's Studio (112×96 over a 7×4 footprint, the roof rising two
// tiles above it): a cosy workshop, bigger than the village houses. Warm plank
// walls on a stone base, a teal shingle roof with a skylight and a chimney,
// wide workshop windows, and a hanging "</>" sign over the door with a lantern
// beside it. Glass (windows, skylight, lantern) glows at night.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { PALETTE } from './palette';

const WIDTH = 112;
const HEIGHT = 96;
const O = PALETTE.wall.outline;
const ROOF = { top: 8, eave: 46, inset: 18 };
const WALL = { left: 4, right: 107, top: 47, bottom: 89 };
const BASE_TOP = 78;
const FOUNDATION_TOP = 90;
/** The door is on the footprint's fourth tile (pixels 48–63). */
const DOOR = { left: 50, right: 61, top: 64 };
const WINDOWS = [
  { left: 12, top: 56, width: 28, height: 15 },
  { left: 72, top: 56, width: 28, height: 15 },
];
const SKYLIGHT = { left: 49, top: 22, width: 14, height: 9 };
const SIGN = { left: 44, top: 50, width: 24, height: 10 };

function roof(c: PixelCanvas): void {
  const { outline, dark, base, light, highlight } = PALETTE.teal;
  for (let y = ROOF.top; y <= ROOF.eave; y++) {
    const t = (y - ROOF.top) / (ROOF.eave - ROOF.top);
    const left = Math.round(ROOF.inset * (1 - t));
    const right = WIDTH - 1 - left;
    fillRect(c, left, y, right - left + 1, 1, outline);
    if (y === ROOF.top || y === ROOF.eave) continue;
    for (let x = left + 1; x < right; x++) {
      const row = y - ROOF.top;
      let color = base;
      if (row % 6 === 0) color = dark;
      else if ((x + (Math.floor(row / 6) % 2) * 5) % 10 === 0) color = dark;
      else if (row % 6 === 1) color = light;
      setPixel(c, x, y, color);
    }
  }
  fillRect(c, ROOF.inset + 1, ROOF.top + 1, WIDTH - 2 * ROOF.inset - 2, 1, highlight);
  // Chimney (stone) on the right slope.
  const stone = PALETTE.cottage;
  fillRect(c, 82, 0, 10, 20, O);
  fillRect(c, 83, 1, 8, 19, stone.stone);
  fillRect(c, 83, 1, 8, 1, stone.stoneLight);
  fillRect(c, 83, 7, 8, 1, stone.stoneDark);
  fillRect(c, 83, 13, 8, 1, stone.stoneDark);
}

function glassPane(
  c: PixelCanvas,
  p: { left: number; top: number; width: number; height: number },
): void {
  const frame = PALETTE.cottage.frame;
  fillRect(c, p.left - 1, p.top - 1, p.width + 2, p.height + 2, frame);
  fillRect(c, p.left, p.top, p.width, p.height, PALETTE.cabin.glass);
  setPixel(c, p.left + 1, p.top + 1, PALETTE.cabin.shine);
  setPixel(c, p.left + 2, p.top + 1, PALETTE.cabin.shine);
  setPixel(c, p.left + 1, p.top + 2, PALETTE.cabin.shine);
}

function skylight(c: PixelCanvas): void {
  const { left, top, width, height } = SKYLIGHT;
  fillRect(c, left - 2, top - 2, width + 4, height + 4, PALETTE.teal.outline);
  glassPane(c, SKYLIGHT);
  fillRect(c, left + Math.floor(width / 2), top, 1, height, PALETTE.cottage.frame);
}

function walls(c: PixelCanvas): void {
  const { left, right, top, bottom } = WALL;
  fillRect(c, left - 1, top, right - left + 3, bottom - top + 1, O);
  const wood = PALETTE.dock;
  // Vertical planks, 6 px wide, with a lit edge and a dark seam.
  for (let y = top; y < BASE_TOP; y++) {
    for (let x = left; x <= right; x++) {
      const band = (x - left) % 6;
      const color = band === 5 ? wood.dark : band === 0 ? wood.light : wood.base;
      setPixel(c, x, y, color);
    }
  }
  // A stone base up to the window sills' height.
  const stone = PALETTE.cottage;
  for (let y = BASE_TOP; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const row = y - BASE_TOP;
      const shifted = x + (Math.floor(row / 4) % 2) * 5;
      const color =
        row % 4 === 3 || shifted % 10 === 0
          ? stone.stoneDark
          : row % 4 === 0
            ? stone.stoneLight
            : stone.stone;
      setPixel(c, x, y, color);
    }
  }
  fillRect(c, left, BASE_TOP - 1, right - left + 1, 1, wood.outline);
  // Corner posts and the eave's shadow.
  for (const x of [left, right - 2]) fillRect(c, x, top, 3, BASE_TOP - top, PALETTE.bark.base);
  fillRect(c, left, top, right - left + 1, 2, PALETTE.bark.outline);
}

function windows(c: PixelCanvas): void {
  for (const w of WINDOWS) {
    glassPane(c, w);
    // Workshop windows: three panes wide, two high.
    for (const k of [1, 2]) {
      fillRect(
        c,
        w.left + Math.round((w.width * k) / 3),
        w.top,
        1,
        w.height,
        PALETTE.cottage.frame,
      );
    }
    fillRect(c, w.left, w.top + Math.floor(w.height / 2), w.width, 1, PALETTE.cottage.frame);
    // A flower box under each window.
    fillRect(c, w.left - 1, w.top + w.height + 1, w.width + 2, 4, O);
    fillRect(c, w.left, w.top + w.height + 2, w.width, 2, PALETTE.cottage.box);
    for (let x = w.left + 1; x < w.left + w.width; x += 3) {
      const petal = (x >> 1) % 2 === 0 ? PALETTE.flowers.red.petal : PALETTE.flowers.yellow.petal;
      setPixel(c, x, w.top + w.height + 1, petal);
    }
  }
}

function door(c: PixelCanvas): void {
  const { left, right, top } = DOOR;
  const width = right - left + 1;
  fillRect(c, left - 1, top - 1, width + 2, FOUNDATION_TOP - top + 1, PALETTE.cottage.frame);
  fillRect(c, left, top, width, FOUNDATION_TOP - top, PALETTE.teal.dark);
  fillRect(c, left + 1, top + 1, width - 2, 1, PALETTE.teal.base);
  // A small window in the door.
  fillRect(c, left + 3, top + 4, width - 6, 5, PALETTE.cabin.glass);
  setPixel(c, right - 2, top + 15, PALETTE.gold.light); // knob
}

/** A hanging sign over the door: a wooden board with "</>" on it. */
function sign(c: PixelCanvas): void {
  const { left, top, width, height } = SIGN;
  // Chains from the eave.
  for (const x of [left + 3, left + width - 4]) fillRect(c, x, top - 3, 1, 3, O);
  fillRect(c, left, top, width, height, O);
  fillRect(c, left + 1, top + 1, width - 2, height - 2, PALETTE.heartwood.base);
  fillRect(c, left + 1, top + 1, width - 2, 1, PALETTE.heartwood.light);
  const ink = PALETTE.teal.outline;
  const y = top + 2;
  // "<"
  setPixel(c, left + 7, y + 1, ink);
  setPixel(c, left + 6, y + 2, ink);
  setPixel(c, left + 5, y + 3, ink);
  setPixel(c, left + 6, y + 4, ink);
  setPixel(c, left + 7, y + 5, ink);
  // "/"
  setPixel(c, left + 13, y, ink);
  setPixel(c, left + 12, y + 1, ink);
  setPixel(c, left + 12, y + 2, ink);
  setPixel(c, left + 11, y + 3, ink);
  setPixel(c, left + 11, y + 4, ink);
  setPixel(c, left + 10, y + 5, ink);
  // ">"
  setPixel(c, left + 16, y + 1, ink);
  setPixel(c, left + 17, y + 2, ink);
  setPixel(c, left + 18, y + 3, ink);
  setPixel(c, left + 17, y + 4, ink);
  setPixel(c, left + 16, y + 5, ink);
}

/** A lantern on the wall right of the door. */
function lantern(c: PixelCanvas): void {
  const x = 66;
  const y = 66;
  fillRect(c, x, y, 6, 9, O);
  fillRect(c, x + 1, y + 2, 4, 5, PALETTE.cabin.glass);
  setPixel(c, x + 2, y + 3, PALETTE.cabin.shine);
  fillRect(c, x - 1, y, 8, 2, PALETTE.bark.outline);
}

function foundation(c: PixelCanvas): void {
  const stone = PALETTE.cottage;
  fillRect(c, WALL.left - 2, FOUNDATION_TOP, WALL.right - WALL.left + 5, 6, O);
  fillRect(c, WALL.left - 1, FOUNDATION_TOP + 1, WALL.right - WALL.left + 3, 4, stone.stone);
  fillRect(c, WALL.left - 1, FOUNDATION_TOP + 1, WALL.right - WALL.left + 3, 1, stone.stoneLight);
  // A wide step in front of the door.
  fillRect(c, DOOR.left - 3, FOUNDATION_TOP, DOOR.right - DOOR.left + 7, 3, stone.stoneLight);
}

function paintStudio(): PixelCanvas {
  const c = createPixelCanvas(WIDTH, HEIGHT);
  walls(c);
  windows(c);
  door(c);
  lantern(c);
  foundation(c);
  roof(c);
  skylight(c);
  sign(c);
  return c;
}

export function paintStudioSprites(): SpriteSource[] {
  return [{ key: 'studio', frames: [paintStudio()] }];
}
