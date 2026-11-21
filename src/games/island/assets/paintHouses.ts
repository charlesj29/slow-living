// The three village houses (80×64 over a 5×3 footprint, roof rising one tile
// above it). One simple, symmetric front-on design: a sloped roof wider than
// the walls, the door in the middle and a window on each side. Each style changes the roof colour and the wall material:
//   stone walls + blue slate roof + chimney, log walls + mossy green roof,
//   white plaster + timber frame + straw thatch.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { PALETTE, type Ramp } from './palette';

const WIDTH = 80;
const HEIGHT = 64;
const ROOF = { top: 4, eave: 27, inset: 14 };
const WALL = { left: 4, right: 75, top: 28, bottom: 57 };
const FOUNDATION = { top: 58, bottom: 63 };
/** The door is centred on the footprint's middle tile (pixel 40). */
const DOOR = { left: 34, right: 45, top: 39 };
const LEFT_WINDOW = { left: 12, top: 35, width: 14, height: 12 };
const RIGHT_WINDOW = { left: 54, top: 35, width: 14, height: 12 };

type WallStyle = 'stone' | 'log' | 'plaster';

interface HouseStyle {
  readonly key: string;
  readonly roof: Ramp;
  readonly walls: WallStyle;
  readonly chimney: boolean;
  /** Thatch gets a thick, rounded eave and straw strokes instead of tile rows. */
  readonly thatched: boolean;
}

const STYLES: readonly HouseStyle[] = [
  { key: 'house_stone', roof: PALETTE.slate, walls: 'stone', chimney: true, thatched: false },
  { key: 'house_log', roof: PALETTE.moss, walls: 'log', chimney: false, thatched: false },
  { key: 'house_thatch', roof: PALETTE.thatch, walls: 'plaster', chimney: false, thatched: true },
];

function roof(canvas: PixelCanvas, style: HouseStyle): void {
  const { outline, dark, base, light, highlight } = style.roof;
  for (let y = ROOF.top; y <= ROOF.eave; y++) {
    // The roof widens from the ridge down to the eave, overhanging the walls.
    const t = (y - ROOF.top) / (ROOF.eave - ROOF.top);
    const left = Math.round(ROOF.inset * (1 - t));
    const right = WIDTH - 1 - left;
    fillRect(canvas, left, y, right - left + 1, 1, outline);
    if (y === ROOF.top || y === ROOF.eave) continue;
    for (let x = left + 1; x < right; x++) {
      const row = y - ROOF.top;
      let color = base;
      if (style.thatched) {
        // Straw: vertical strokes, lighter towards the top.
        color = (x * 7 + Math.floor(row / 3)) % 5 === 0 ? dark : row < 8 ? light : base;
      } else if (row % 5 === 0) {
        color = dark; // a shadow line under each row of shingles
      } else if ((x + (Math.floor(row / 5) % 2) * 4) % 8 === 0) {
        color = dark; // gaps between shingles, staggered row by row
      } else if (row % 5 === 1) {
        color = light;
      }
      setPixel(canvas, x, y, color);
    }
  }
  fillRect(canvas, ROOF.inset + 1, ROOF.top + 1, WIDTH - 2 * ROOF.inset - 2, 1, highlight);
  if (style.thatched) {
    // A thick, rounded straw eave.
    fillRect(canvas, 1, ROOF.eave - 2, WIDTH - 2, 3, base);
    fillRect(canvas, 1, ROOF.eave - 2, WIDTH - 2, 1, light);
    fillRect(canvas, 0, ROOF.eave + 1, WIDTH, 1, outline);
  }
  if (style.chimney) {
    const stone = PALETTE.cottage;
    fillRect(canvas, 56, 0, 8, 12, PALETTE.wall.outline);
    fillRect(canvas, 57, 1, 6, 11, stone.stone);
    fillRect(canvas, 57, 1, 6, 1, stone.stoneLight);
    fillRect(canvas, 57, 5, 6, 1, stone.stoneDark);
  }
}

function walls(canvas: PixelCanvas, style: WallStyle): void {
  const { left, right, top, bottom } = WALL;
  const width = right - left + 1;
  fillRect(canvas, left - 1, top, width + 2, bottom - top + 1, PALETTE.wall.outline);
  const c = PALETTE.cottage;
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const row = y - top;
      let color = c.plaster;
      if (style === 'stone') {
        // Blocks 8×5, staggered; mortar lines darker, block tops lighter.
        const shifted = x + (Math.floor(row / 5) % 2) * 4;
        color =
          row % 5 === 4 || shifted % 8 === 0 ? c.stoneDark : row % 5 === 0 ? c.stoneLight : c.stone;
      } else if (style === 'log') {
        // Horizontal logs 4 px tall: lit top, dark bottom seam.
        const band = row % 4;
        color =
          band === 3 ? PALETTE.bark.outline : band === 0 ? PALETTE.bark.light : PALETTE.bark.base;
      } else if (x === left || x === right || row === 0 || row === 6) {
        color = c.beam; // timber frame on white plaster
      } else if ((x * 5 + row * 11) % 37 === 0) {
        color = c.plasterLight;
      }
      setPixel(canvas, x, y, color);
    }
  }
  if (style === 'log') {
    // Round log ends at both corners.
    for (let y = top; y <= bottom; y += 4) {
      for (const x of [left, right]) {
        setPixel(canvas, x, y + 1, PALETTE.heartwood.base);
        setPixel(canvas, x, y + 2, PALETTE.heartwood.dark);
      }
    }
  }
  // The eave's shadow on the top of the wall.
  fillRect(canvas, left, top, width, 2, style === 'log' ? PALETTE.bark.outline : c.beamDark);
}

function window(
  canvas: PixelCanvas,
  w: { left: number; top: number; width: number; height: number },
): void {
  const { left, top, width, height } = w;
  fillRect(canvas, left - 1, top - 1, width + 2, height + 2, PALETTE.cottage.frame);
  fillRect(canvas, left, top, width, height, PALETTE.cabin.glass);
  fillRect(canvas, left + Math.floor(width / 2), top, 1, height, PALETTE.cottage.frame);
  fillRect(canvas, left, top + Math.floor(height / 2), width, 1, PALETTE.cottage.frame);
  setPixel(canvas, left + 1, top + 1, PALETTE.cabin.shine);
  setPixel(canvas, left + 2, top + 1, PALETTE.cabin.shine);
  setPixel(canvas, left + 1, top + 2, PALETTE.cabin.shine);
  // Sill.
  fillRect(canvas, left - 2, top + height + 1, width + 4, 1, PALETTE.cottage.boxDark);
}

function door(canvas: PixelCanvas): void {
  const { left, right, top } = DOOR;
  const width = right - left + 1;
  fillRect(canvas, left - 1, top - 1, width + 2, FOUNDATION.top - top + 1, PALETTE.cottage.frame);
  fillRect(canvas, left, top, width, FOUNDATION.top - top, PALETTE.cabin.door);
  for (let x = left + 3; x < right; x += 4) {
    fillRect(canvas, x, top, 1, FOUNDATION.top - top, PALETTE.cabin.doorDark);
  }
  setPixel(canvas, right - 2, top + 10, PALETTE.flowers.centerWarm); // knob
}

function foundation(canvas: PixelCanvas): void {
  const c = PALETTE.cottage;
  fillRect(
    canvas,
    WALL.left - 2,
    FOUNDATION.top,
    WALL.right - WALL.left + 5,
    6,
    PALETTE.wall.outline,
  );
  fillRect(canvas, WALL.left - 1, FOUNDATION.top + 1, WALL.right - WALL.left + 3, 4, c.stone);
  fillRect(canvas, WALL.left - 1, FOUNDATION.top + 1, WALL.right - WALL.left + 3, 1, c.stoneLight);
  // A step in front of the door.
  fillRect(canvas, DOOR.left - 2, FOUNDATION.top, DOOR.right - DOOR.left + 5, 3, c.stoneLight);
}

function paintHouse(style: HouseStyle): PixelCanvas {
  const canvas = createPixelCanvas(WIDTH, HEIGHT);
  walls(canvas, style.walls);
  window(canvas, LEFT_WINDOW);
  window(canvas, RIGHT_WINDOW);
  door(canvas);
  foundation(canvas);
  roof(canvas, style);
  return canvas;
}

export function paintHouseSprites(): SpriteSource[] {
  return STYLES.map((style) => ({ key: style.key, frames: [paintHouse(style)] }));
}
