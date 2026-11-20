// The cabin: 48×64 px. The bottom 48 px match its 3×3-tile footprint; the roof
// rises one extra tile above it (drawn over whatever stands behind the cabin).
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { TILE_PX } from './paint';
import { PALETTE } from './palette';

const WIDTH = TILE_PX * 3;
const HEIGHT = TILE_PX * 4;
const ROOF_BOTTOM = 34;
const WALL_LEFT = 3;
const WALL_RIGHT = WIDTH - 4;
const DOOR_LEFT = 20;
const DOOR_WIDTH = 8;
const DOOR_TOP = 46;

function paintRoof(canvas: PixelCanvas): void {
  const { roof, roofLight, roofDark } = PALETTE.cabin;
  for (let y = 1; y <= ROOF_BOTTOM; y++) {
    // Overhang widens slightly towards the eaves.
    const inset = Math.max(0, 3 - Math.floor(y / 6));
    const isShingleLine = y % 4 === 0;
    fillRect(canvas, inset, y, WIDTH - inset * 2, 1, isShingleLine ? roofDark : roof);
    if (!isShingleLine) {
      for (let x = inset + ((y >> 2) % 2) * 3; x < WIDTH - inset; x += 6)
        setPixel(canvas, x, y, roofDark);
    }
  }
  fillRect(canvas, 3, 1, WIDTH - 6, 2, roofLight); // ridge catches the light
  fillRect(canvas, 0, ROOF_BOTTOM, WIDTH, 1, roofDark); // eaves
  // Chimney
  fillRect(canvas, 33, 0, 6, 9, PALETTE.cabin.stone);
  fillRect(canvas, 33, 0, 6, 1, PALETTE.cabin.stoneDark);
  fillRect(canvas, 38, 1, 1, 8, PALETTE.cabin.stoneDark);
}

function paintWall(canvas: PixelCanvas): void {
  const { log, logLight, logDark } = PALETTE.cabin;
  for (let y = ROOF_BOTTOM + 1; y < HEIGHT - 2; y++) {
    const row = y - ROOF_BOTTOM - 1;
    const color = row % 4 === 3 ? logDark : row % 4 === 0 ? logLight : log;
    fillRect(canvas, WALL_LEFT, y, WALL_RIGHT - WALL_LEFT + 1, 1, color);
  }
  fillRect(canvas, WALL_LEFT, ROOF_BOTTOM + 1, 2, HEIGHT - ROOF_BOTTOM - 3, logDark);
  fillRect(canvas, WALL_RIGHT - 1, ROOF_BOTTOM + 1, 2, HEIGHT - ROOF_BOTTOM - 3, logDark);
}

function paintWindow(canvas: PixelCanvas, left: number): void {
  const { glass, frame } = PALETTE.cabin;
  fillRect(canvas, left, 40, 8, 8, frame);
  fillRect(canvas, left + 1, 41, 6, 6, glass);
  fillRect(canvas, left + 4, 41, 1, 6, frame);
  fillRect(canvas, left + 1, 44, 6, 1, frame);
  setPixel(canvas, left + 2, 42, PALETTE.foam.bright);
}

function paintDoor(canvas: PixelCanvas): void {
  const { door, doorFrame, stone, stoneDark } = PALETTE.cabin;
  fillRect(canvas, DOOR_LEFT - 1, DOOR_TOP - 1, DOOR_WIDTH + 2, HEIGHT - DOOR_TOP - 1, doorFrame);
  fillRect(canvas, DOOR_LEFT, DOOR_TOP, DOOR_WIDTH, HEIGHT - DOOR_TOP - 2, door);
  fillRect(canvas, DOOR_LEFT + 3, DOOR_TOP, 1, HEIGHT - DOOR_TOP - 2, doorFrame);
  setPixel(canvas, DOOR_LEFT + DOOR_WIDTH - 2, DOOR_TOP + 8, PALETTE.flowers.centerWarm);
  // Stone step in front of the door
  fillRect(canvas, DOOR_LEFT - 2, HEIGHT - 2, DOOR_WIDTH + 4, 2, stone);
  fillRect(canvas, DOOR_LEFT - 2, HEIGHT - 1, DOOR_WIDTH + 4, 1, stoneDark);
}

export function paintCabinSprites(): SpriteSource[] {
  const canvas = createPixelCanvas(WIDTH, HEIGHT);
  paintWall(canvas);
  paintRoof(canvas);
  paintWindow(canvas, 8);
  paintWindow(canvas, 32);
  paintDoor(canvas);
  return [{ key: 'cabin', frames: [canvas] }];
}
