// The chicken coop's hen house: a little wooden hut with a red gable roof, a
// round doorway with straw peeking out, a ramp down to the run, and a perch
// bar. 32×40 over a 2×2 footprint (the roof rises above it). Light from the
// top-left, like everything else.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  hexToRgba,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { PALETTE } from './palette';

export const COOP_KEY = 'chicken_coop';

/** Deep brown: the dark inside the hen house. */
const DOORWAY = hexToRgba('#2e1c10');

const W = 32;
const H = 40;
/** The roof's apex, and the row its eaves come down to. */
const APEX = { x: 15.5, y: 3 } as const;
const EAVES_Y = 18;
/** The walls (planks) and the round doorway (its middle and radius). */
const WALL = { left: 4, right: 27, top: 17, bottom: 37 } as const;
const DOOR = { x: 13, y: 31, r: 4 } as const;

function henHouse(): PixelCanvas {
  const c = createPixelCanvas(W, H);
  const wood = PALETTE.heartwood;
  const roof = PALETTE.roof;
  // Plank walls, seams every four pixels, shaded on the right.
  fillRect(
    c,
    WALL.left - 1,
    WALL.top,
    WALL.right - WALL.left + 3,
    WALL.bottom - WALL.top + 2,
    wood.outline,
  );
  fillRect(
    c,
    WALL.left,
    WALL.top,
    WALL.right - WALL.left + 1,
    WALL.bottom - WALL.top + 1,
    wood.light,
  );
  for (let x = WALL.left; x <= WALL.right; x++) {
    if ((x - WALL.left) % 4 === 3)
      fillRect(c, x, WALL.top, 1, WALL.bottom - WALL.top + 1, wood.base);
  }
  fillRect(c, WALL.right - 3, WALL.top, 4, WALL.bottom - WALL.top + 1, wood.base);
  fillRect(c, WALL.left, WALL.bottom - 1, WALL.right - WALL.left + 1, 2, wood.dark); // the sill
  // The round doorway, dark inside, with straw peeking out at the bottom.
  for (let y = DOOR.y - DOOR.r; y <= DOOR.y + DOOR.r; y++) {
    for (let x = DOOR.x - DOOR.r; x <= DOOR.x + DOOR.r; x++) {
      const d = Math.hypot(x - DOOR.x, (y - DOOR.y) * 1.1);
      if (d <= DOOR.r - 0.6 && y <= WALL.bottom - 2) setPixel(c, x, y, DOORWAY);
      else if (d <= DOOR.r + 0.4 && y <= WALL.bottom - 2) setPixel(c, x, y, wood.outline);
    }
  }
  for (const [x, y] of [
    [11, 34],
    [12, 33],
    [14, 34],
    [15, 33],
    [13, 34],
  ] as const) {
    setPixel(c, x, y, PALETTE.thatch.light);
  }
  // A little ramp with cleats, down to the run on the right of the door.
  for (let i = 0; i < 9; i++) {
    const x = DOOR.x + 3 + i;
    const y = WALL.bottom - 3 + Math.floor(i / 2.2);
    fillRect(c, x, y, 1, 2, i % 3 === 1 ? wood.dark : wood.highlight);
    setPixel(c, x, y + 2, wood.outline);
  }
  // A perch bar across the wall.
  fillRect(c, 19, 24, 7, 1, wood.dark);
  // The gable roof: shingle rows, overhanging the walls.
  for (let y = APEX.y; y <= EAVES_Y; y++) {
    const half = ((y - APEX.y) / (EAVES_Y - APEX.y)) * (W / 2 + 0.5);
    const left = Math.round(APEX.x - half);
    const right = Math.round(APEX.x + half);
    fillRect(c, left, y, right - left + 1, 1, roof.outline);
    if (right - left > 2) {
      const shade = (y - APEX.y) % 4 === 3 ? roof.dark : y < APEX.y + 5 ? roof.light : roof.base;
      fillRect(c, left + 1, y, right - left - 1, 1, shade);
      fillRect(
        c,
        Math.round(APEX.x) + 1,
        y,
        Math.max(0, right - Math.round(APEX.x) - 1),
        1,
        (y - APEX.y) % 4 === 3 ? roof.outline : roof.dark,
      );
    }
  }
  fillRect(c, 0, EAVES_Y, W, 1, roof.outline); // the eaves' edge
  setPixel(c, Math.round(APEX.x) - 1, APEX.y + 2, roof.highlight);
  return c;
}

export function paintCoopSprites(): SpriteSource[] {
  return [{ key: COOP_KEY, frames: [henHouse()] }];
}
