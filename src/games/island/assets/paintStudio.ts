// The Developer's Studio (112×96 over a 7×4 footprint): a modern, cosy
// workshop that stands apart from the village. A slanted shed roof with a
// solar panel, an antenna and a metal flue; warm vertical board cladding; a big
// glass window wall with a lamp inside; a glass-panelled door; and a "</>"
// sign whose letters glow like neon at night (lamp and flame colours).
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  hexToRgba,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { boardWall, O, plankDoor, windowAt } from './paintHouseParts';
import { PALETTE } from './palette';

const WIDTH = 112;
const HEIGHT = 96;
/** The door is on the footprint's fourth tile, matching the registry's door. */
const DOOR_X = 56;
const WALL = { left: 5, right: 106, bottom: 89 } as const;
const ROOF = { leftY: 14, rightY: 34, thickness: 5, left: 1, right: 110 } as const;
const SOLAR = { panel: hexToRgba('#26406a'), grid: hexToRgba('#4f78ae') } as const;
const C = PALETTE.cottage;

/** The roof's top edge at x (it slopes down to the right). */
const roofTop = (x: number): number =>
  Math.round(
    ROOF.leftY + ((x - ROOF.left) / (ROOF.right - ROOF.left)) * (ROOF.rightY - ROOF.leftY),
  );

function roof(c: PixelCanvas): void {
  const t = PALETTE.teal;
  for (let x = ROOF.left; x <= ROOF.right; x++) {
    const top = roofTop(x);
    fillRect(c, x, top, 1, ROOF.thickness, (x - ROOF.left) % 6 === 0 ? t.dark : t.base);
    setPixel(c, x, top, t.light);
    setPixel(c, x, top - 1, t.outline);
    setPixel(c, x, top + ROOF.thickness, t.outline);
  }
  for (const x of [ROOF.left, ROOF.right]) fillRect(c, x, roofTop(x), 1, ROOF.thickness, t.outline);
}

/** A solar panel lying on the roof's left half, a metal flue and an antenna on the right. */
function roofFixtures(c: PixelCanvas): { x: number; y: number } {
  for (let x = 12; x <= 46; x++) {
    const top = roofTop(x);
    fillRect(c, x, top - 6, 1, 6, (x - 12) % 6 === 0 ? SOLAR.grid : SOLAR.panel);
    setPixel(c, x, top - 7, O);
    setPixel(c, x, top - 4, SOLAR.grid);
  }
  for (const x of [11, 47]) fillRect(c, x, roofTop(x) - 7, 1, 7, O);
  // The flue (smoke leaves from its top).
  const flueX = 86;
  const flueTop = roofTop(flueX) - 11;
  fillRect(c, flueX - 1, flueTop, 6, 11, O);
  fillRect(c, flueX, flueTop + 1, 4, 10, PALETTE.rock.light);
  fillRect(c, flueX - 2, flueTop, 8, 2, O);
  // The antenna.
  const antennaX = 100;
  fillRect(c, antennaX, roofTop(antennaX) - 12, 1, 12, O);
  fillRect(c, antennaX - 3, roofTop(antennaX) - 9, 7, 1, O);
  fillRect(c, antennaX - 2, roofTop(antennaX) - 6, 5, 1, O);
  return { x: flueX + 2, y: flueTop - 1 };
}

function facade(c: PixelCanvas): void {
  for (let x = WALL.left; x <= WALL.right; x++) {
    const top = roofTop(x) + ROOF.thickness + 1;
    boardWall(c, { left: x, right: x, top, bottom: WALL.bottom });
    // The roof's shadow along the top of the wall.
    fillRect(c, x, top, 1, 2, PALETTE.dock.outline);
  }
  fillRect(c, WALL.left - 1, roofTop(WALL.left) + ROOF.thickness, 1, 80, O);
  fillRect(c, WALL.right + 1, roofTop(WALL.right) + ROOF.thickness, 1, 60, O);
}

/** The big glass window wall on the left, with a warm lamp hanging inside. */
function glassWall(c: PixelCanvas): void {
  const left = 10;
  const top = 42;
  const right = 42;
  const bottom = 84;
  fillRect(c, left - 2, top - 2, right - left + 5, bottom - top + 5, O);
  fillRect(c, left - 1, top - 1, right - left + 3, bottom - top + 3, C.frame);
  fillRect(c, left, top, right - left + 1, bottom - top + 1, PALETTE.cabin.glass);
  for (const x of [left + 10, left + 21]) fillRect(c, x, top, 1, bottom - top + 1, C.frame);
  fillRect(c, left, top + 22, right - left + 1, 1, C.frame);
  for (let i = 0; i < 4; i++) setPixel(c, left + 1 + i, top + 1 + i, PALETTE.cabin.shine);
  // A pendant lamp inside (glows at night).
  fillRect(c, 26, top, 1, 6, O);
  fillRect(c, 23, top + 6, 7, 3, O);
  fillRect(c, 24, top + 6, 5, 2, PALETTE.lampShade);
  // A desk with a screen, seen through the glass.
  fillRect(c, 14, 72, 22, 2, PALETTE.dock.dark);
  fillRect(c, 22, 64, 8, 6, PALETTE.screen.body);
  fillRect(c, 23, 65, 6, 4, PALETTE.screen.glow);
  fillRect(c, 25, 70, 2, 2, PALETTE.screen.body);
}

/** A "</>" sign over the door: dark board, letters in lamp and flame colours (neon at night). */
function sign(c: PixelCanvas): void {
  const left = 44;
  const top = 46;
  fillRect(c, left, top, 24, 10, O);
  fillRect(c, left + 1, top + 1, 22, 8, PALETTE.screen.body);
  const glyphs: readonly (readonly [number, number])[] = [
    [7, 2],
    [6, 3],
    [5, 4],
    [6, 5],
    [7, 6], // <
    [13, 1],
    [12, 2],
    [12, 3],
    [11, 4],
    [11, 5],
    [10, 6], // /
    [16, 2],
    [17, 3],
    [18, 4],
    [17, 5],
    [16, 6], // >
  ];
  glyphs.forEach(([x, y], i) => {
    setPixel(c, left + x, top + y + 1, i < 5 || i > 10 ? PALETTE.lampShade : PALETTE.fire.bright);
  });
}

function door(c: PixelCanvas): void {
  plankDoor(c, DOOR_X, WALL.bottom + 1, { height: 22, color: PALETTE.teal.dark });
  fillRect(c, DOOR_X - 4, WALL.bottom - 19, 8, 9, O);
  fillRect(c, DOOR_X - 3, WALL.bottom - 18, 6, 7, PALETTE.cabin.glass);
  setPixel(c, DOOR_X - 2, WALL.bottom - 17, PALETTE.cabin.shine);
}

/** A potted plant beside the door. */
function plant(c: PixelCanvas): void {
  fillRect(c, 66, 82, 8, 8, O);
  fillRect(c, 67, 83, 6, 6, PALETTE.terracotta.base);
  fillRect(c, 67, 83, 6, 1, PALETTE.terracotta.light);
  for (const [x, y] of [
    [66, 76],
    [69, 73],
    [72, 76],
    [68, 79],
    [71, 79],
    [70, 75],
  ] as const) {
    fillRect(c, x, y, 3, 4, PALETTE.leafy.base);
    setPixel(c, x, y, PALETTE.leafy.light);
  }
}

/** A plain concrete base with a step at the door. */
function base(c: PixelCanvas): void {
  fillRect(c, 3, WALL.bottom + 1, WIDTH - 6, 4, PALETTE.rock.dark);
  fillRect(c, 3, WALL.bottom + 1, WIDTH - 6, 2, PALETTE.rock.light);
  fillRect(c, DOOR_X - 10, WALL.bottom + 1, 20, 3, PALETTE.rock.highlight);
}

function paintStudio(): { canvas: PixelCanvas; chimneyTop: { x: number; y: number } } {
  const c = createPixelCanvas(WIDTH, HEIGHT);
  facade(c);
  glassWall(c);
  windowAt(c, 80, 54, 14, { flowers: true });
  sign(c);
  door(c);
  plant(c);
  base(c);
  roof(c);
  const chimneyTop = roofFixtures(c);
  return { canvas: c, chimneyTop };
}

/** Where smoke leaves the studio's flue (sprite pixels from the top-left). */
export const STUDIO_CHIMNEY_TOP = paintStudio().chimneyTop;

export function paintStudioSprites(): SpriteSource[] {
  return [{ key: 'studio', frames: [paintStudio().canvas] }];
}
