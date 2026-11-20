// The cabin: 80×64 px. The bottom 48 px match its 5×3-tile footprint; the roof
// rises one extra tile above it (drawn over whatever stands behind the cabin).
// Symmetric: door in the middle tile (matches the registry's door), one window
// on each side.
// Outlined, chunky shading in the classic handheld style (original design).
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { TILE_PX } from './paint';
import { PALETTE } from './palette';

const WIDTH = TILE_PX * 5;
const HEIGHT = TILE_PX * 4;
const ROOF_TOP = 4;
/** The wall below the eaves is a fixed height; the roof takes the rest. */
const ROOF_BOTTOM = HEIGHT - 31;
const WALL_LEFT = 3;
const WALL_RIGHT = WIDTH - 4;
const WALL_BOTTOM = HEIGHT - 3;
const DOOR_WIDTH = 10;
const DOOR_LEFT = (WIDTH - DOOR_WIDTH) / 2;
const DOOR_TOP = ROOF_BOTTOM + 11;
const WINDOW_TOP = ROOF_BOTTOM + 6;
const WINDOW_WIDTH = 10;
const WINDOW_INSET = 12;
const WINDOW_LEFTS = [WINDOW_INSET, WIDTH - WINDOW_INSET - WINDOW_WIDTH] as const;
const CHIMNEY_LEFT = WIDTH - 18;

function paintChimney(canvas: PixelCanvas): void {
  const { stone, stoneDark } = PALETTE.cabin;
  const x = CHIMNEY_LEFT;
  fillRect(canvas, x, 0, 8, 14, PALETTE.roof.outline);
  fillRect(canvas, x + 1, 1, 6, 12, stone);
  fillRect(canvas, x + 1, 1, 6, 1, PALETTE.foam.soft);
  fillRect(canvas, x + 6, 2, 1, 11, stoneDark);
  for (let y = 4; y < 13; y += 3) fillRect(canvas, x + 1, y, 5, 1, stoneDark);
}

function paintRoof(canvas: PixelCanvas): void {
  const { outline, dark, base, light, highlight } = PALETTE.roof;
  for (let y = ROOF_TOP; y <= ROOF_BOTTOM; y++) {
    // The roof flares out slightly towards the eaves.
    const inset = Math.max(0, 3 - Math.floor((y - ROOF_TOP) / 7));
    const row = (y - ROOF_TOP) % 5;
    const tone = row === 4 ? dark : row === 0 ? light : base;
    fillRect(canvas, inset, y, WIDTH - inset * 2, 1, tone);
    // Staggered shingle seams.
    if (row !== 4) {
      const offset = Math.floor((y - ROOF_TOP) / 5) % 2 === 0 ? 2 : 6;
      for (let x = inset + offset; x < WIDTH - inset; x += 8) setPixel(canvas, x, y, dark);
    }
    setPixel(canvas, inset, y, outline);
    setPixel(canvas, WIDTH - inset - 1, y, outline);
  }
  // Ridge cap and eaves
  fillRect(canvas, 3, ROOF_TOP - 1, WIDTH - 6, 1, outline);
  fillRect(canvas, 3, ROOF_TOP, WIDTH - 6, 2, highlight);
  fillRect(canvas, 0, ROOF_BOTTOM, WIDTH, 2, outline);
  fillRect(canvas, 1, ROOF_BOTTOM - 1, WIDTH - 2, 1, dark);
}

function paintWall(canvas: PixelCanvas): void {
  const { outline, dark, base, light } = PALETTE.wall;
  fillRect(
    canvas,
    WALL_LEFT - 1,
    ROOF_BOTTOM + 2,
    WALL_RIGHT - WALL_LEFT + 3,
    WALL_BOTTOM - ROOF_BOTTOM - 1,
    outline,
  );
  for (let y = ROOF_BOTTOM + 2; y < WALL_BOTTOM; y++) {
    const row = (y - ROOF_BOTTOM - 2) % 4;
    const tone = row === 3 ? dark : row === 0 ? light : base;
    fillRect(canvas, WALL_LEFT, y, WALL_RIGHT - WALL_LEFT + 1, 1, tone);
  }
  // Shadow under the eaves and log ends at the corners.
  fillRect(canvas, WALL_LEFT, ROOF_BOTTOM + 2, WALL_RIGHT - WALL_LEFT + 1, 1, outline);
  for (const x of [WALL_LEFT, WALL_RIGHT - 2]) {
    fillRect(canvas, x, ROOF_BOTTOM + 3, 3, WALL_BOTTOM - ROOF_BOTTOM - 3, dark);
    fillRect(canvas, x, ROOF_BOTTOM + 3, 1, WALL_BOTTOM - ROOF_BOTTOM - 3, light);
  }
}

function paintWindow(canvas: PixelCanvas, left: number): void {
  const { glass, shine } = PALETTE.cabin;
  const frame = PALETTE.wall.outline;
  const top = WINDOW_TOP;
  fillRect(canvas, left, top, 10, 10, frame);
  fillRect(canvas, left + 1, top + 1, 8, 8, glass);
  fillRect(canvas, left + 5, top + 1, 1, 8, frame);
  fillRect(canvas, left + 1, top + 5, 8, 1, frame);
  setPixel(canvas, left + 2, top + 2, shine);
  setPixel(canvas, left + 3, top + 2, shine);
  setPixel(canvas, left + 2, top + 3, shine);
  // Window box with a flower or two
  fillRect(canvas, left, top + 10, 10, 2, PALETTE.wall.dark);
  setPixel(canvas, left + 2, top + 9, PALETTE.flowers.red.petal);
  setPixel(canvas, left + 7, top + 9, PALETTE.flowers.yellow.petal);
}

function paintDoor(canvas: PixelCanvas): void {
  const { door, doorDark, stone, stoneDark } = PALETTE.cabin;
  const outline = PALETTE.wall.outline;
  fillRect(
    canvas,
    DOOR_LEFT - 1,
    DOOR_TOP - 1,
    DOOR_WIDTH + 2,
    WALL_BOTTOM - DOOR_TOP + 1,
    outline,
  );
  fillRect(canvas, DOOR_LEFT, DOOR_TOP, DOOR_WIDTH, WALL_BOTTOM - DOOR_TOP, door);
  fillRect(canvas, DOOR_LEFT, DOOR_TOP, DOOR_WIDTH, 1, PALETTE.wall.light);
  fillRect(canvas, DOOR_LEFT + 4, DOOR_TOP + 1, 1, WALL_BOTTOM - DOOR_TOP - 1, doorDark);
  fillRect(
    canvas,
    DOOR_LEFT + DOOR_WIDTH - 1,
    DOOR_TOP + 1,
    1,
    WALL_BOTTOM - DOOR_TOP - 1,
    doorDark,
  );
  setPixel(canvas, DOOR_LEFT + DOOR_WIDTH - 3, DOOR_TOP + 8, PALETTE.flowers.centerWarm);
  // Stone step in front of the door
  fillRect(canvas, DOOR_LEFT - 2, WALL_BOTTOM, DOOR_WIDTH + 4, 3, outline);
  fillRect(canvas, DOOR_LEFT - 1, WALL_BOTTOM, DOOR_WIDTH + 2, 2, stone);
  fillRect(canvas, DOOR_LEFT - 1, WALL_BOTTOM + 1, DOOR_WIDTH + 2, 1, stoneDark);
}

export function paintCabinSprites(): SpriteSource[] {
  const canvas = createPixelCanvas(WIDTH, HEIGHT);
  paintWall(canvas);
  paintRoof(canvas);
  paintChimney(canvas);
  for (const left of WINDOW_LEFTS) paintWindow(canvas, left);
  paintDoor(canvas);
  return [{ key: 'cabin', frames: [canvas] }];
}
