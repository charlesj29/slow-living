// The cottage: 96×96 px. The bottom 64 px match its 6×4-tile footprint; the
// roof rises two tiles above it. Cozy 16-bit style (original design): a tiled
// back roof and side wing, a timber-framed front gable over the door, plaster
// walls, shuttered windows with flower boxes, a stone foundation and steps.
// Light comes from the top-left: left roof planes are lit, right ones shaded.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';
import { TILE_PX } from './paint';
import { PALETTE } from './palette';

const WIDTH = TILE_PX * 6;
const HEIGHT = TILE_PX * 6;
/** Door tile (third from the left), matching the registry's door. */
const DOOR_CENTER = TILE_PX * 2 + TILE_PX / 2;
const GABLE = { apexX: DOOR_CENTER, apexY: 4, eaveY: 62, halfWidth: 32, thickness: 9 } as const;
const WALL_BOTTOM = 86;
const FOUNDATION_BOTTOM = 93;
const WING = { left: 66, right: 91, roofTop: 22, eaveY: 56 } as const;
const BACK_ROOF = { left: 6, right: 66, top: 12 } as const;
const WINDOW_SIZE = 10;

const { roof, wall } = PALETTE;
const C = PALETTE.cottage;

/** Horizontal rows of roof tiles with staggered seams, a lit top edge per row and dark eaves. */
function tiledRoof(
  canvas: PixelCanvas,
  left: number,
  right: number,
  top: number,
  bottom: number,
): void {
  for (let y = top; y <= bottom; y++) {
    const row = (y - top) % 5;
    const tone = row === 0 ? roof.light : row === 4 ? roof.dark : roof.base;
    fillRect(canvas, left, y, right - left + 1, 1, tone);
    if (row > 0 && row < 4) {
      const offset = Math.floor((y - top) / 5) % 2 === 0 ? 3 : 7;
      for (let x = left + offset; x <= right; x += 8) setPixel(canvas, x, y, roof.dark);
    }
  }
  fillRect(canvas, left, top - 1, right - left + 1, 1, roof.outline);
  fillRect(canvas, left, bottom + 1, right - left + 1, 2, roof.outline);
  fillRect(canvas, left - 1, top - 1, 1, bottom - top + 4, roof.outline);
  fillRect(canvas, right + 1, top - 1, 1, bottom - top + 4, roof.outline);
}

/** Plaster wall with timber posts and a beam along the top. */
function timberWall(
  canvas: PixelCanvas,
  left: number,
  right: number,
  top: number,
  posts: readonly number[],
): void {
  fillRect(canvas, left, top, right - left + 1, WALL_BOTTOM - top, C.plaster);
  fillRect(canvas, left, top, right - left + 1, 2, C.beam);
  fillRect(canvas, left, top + 2, right - left + 1, 1, C.beamDark);
  for (const x of posts) {
    fillRect(canvas, x, top, 2, WALL_BOTTOM - top, C.beam);
    setPixel(canvas, x + 1, top + 2, C.beamDark);
  }
  // Plaster catches the light along the left edge; the wall is outlined.
  fillRect(canvas, left, top + 3, 1, WALL_BOTTOM - top - 3, C.plasterLight);
  fillRect(canvas, left - 1, top, 1, WALL_BOTTOM - top, wall.outline);
  fillRect(canvas, right + 1, top, 1, WALL_BOTTOM - top, wall.outline);
}

/** A window with a cross frame, shutters either side and a flower box below. */
function shutteredWindow(canvas: PixelCanvas, left: number, top: number): void {
  const size = WINDOW_SIZE;
  fillRect(canvas, left - 1, top - 1, size + 2, size + 2, wall.outline);
  fillRect(canvas, left, top, size, size, PALETTE.cabin.glass);
  fillRect(canvas, left, top, size, 1, C.frame);
  fillRect(canvas, left + size / 2, top, 1, size, C.frame);
  fillRect(canvas, left, top + size / 2, size, 1, C.frame);
  setPixel(canvas, left + 1, top + 1, PALETTE.cabin.shine);
  setPixel(canvas, left + 2, top + 1, PALETTE.cabin.shine);
  setPixel(canvas, left + 1, top + 2, PALETTE.cabin.shine);
  for (const x of [left - 4, left + size + 1]) {
    fillRect(canvas, x, top - 1, 3, size + 2, C.shutter);
    fillRect(canvas, x, top - 1, 3, 1, C.shutterLight);
    fillRect(canvas, x + 1, top + 1, 1, size - 2, C.shutterDark);
  }
  fillRect(canvas, left - 1, top + size + 1, size + 2, 3, C.box);
  fillRect(canvas, left - 1, top + size + 3, size + 2, 1, C.boxDark);
  const blooms: readonly Rgba[] = [
    PALETTE.flowers.red.petal,
    PALETTE.flowers.yellow.petal,
    PALETTE.flowers.white.petal,
  ];
  for (let i = 0; i < 4; i++) {
    setPixel(canvas, left + 1 + i * 3, top + size, PALETTE.grass.dark);
    setPixel(canvas, left + i * 3, top + size, blooms[i % blooms.length] ?? roof.base);
  }
}

/** The A-shaped front gable: a timbered triangle wall inside two tiled roof planes. */
function frontGable(canvas: PixelCanvas): void {
  const { apexX, apexY, eaveY, halfWidth, thickness } = GABLE;
  const slope = halfWidth / (eaveY - apexY);
  for (let y = apexY; y <= eaveY; y++) {
    const half = (y - apexY) * slope;
    const innerHalf = half - thickness;
    if (innerHalf > 0) {
      fillRect(canvas, Math.round(apexX - innerHalf), y, Math.round(innerHalf * 2), 1, C.plaster);
    }
    for (const side of [-1, 1]) {
      const outer = apexX + side * half;
      const inner = apexX + side * Math.max(0, innerHalf);
      const from = Math.round(Math.min(outer, inner));
      const to = Math.round(Math.max(outer, inner));
      const lit = side < 0;
      for (let x = from; x <= to; x++) {
        const along = (y + Math.abs(x - apexX)) % 5;
        let tone = lit ? roof.base : roof.dark;
        if (along === 0) tone = lit ? roof.highlight : roof.light;
        else if (along === 4) tone = roof.dark;
        setPixel(canvas, x, y, tone);
      }
      setPixel(canvas, Math.round(outer), y, roof.outline);
      setPixel(canvas, Math.round(outer) + side, y, roof.outline);
      if (innerHalf > 0) setPixel(canvas, Math.round(inner), y, roof.dark);
    }
  }
  // Timber inside the gable: king post, crossbeam, braces, and a small attic window.
  fillRect(canvas, apexX - 1, apexY + thickness + 2, 2, eaveY - apexY - thickness - 2, C.beam);
  const beamY = eaveY - 14;
  const beamHalf = (beamY - apexY) * slope - thickness;
  fillRect(canvas, Math.round(apexX - beamHalf), beamY, Math.round(beamHalf * 2), 2, C.beam);
  for (let i = 0; i < 12; i++) {
    setPixel(canvas, apexX - 2 - i, beamY + 2 + i, C.beam);
    setPixel(canvas, apexX + 1 + i, beamY + 2 + i, C.beam);
  }
  fillRect(canvas, apexX - 4, beamY - 10, 8, 7, wall.outline);
  fillRect(canvas, apexX - 3, beamY - 9, 6, 5, PALETTE.cabin.glass);
  fillRect(canvas, apexX - 3, beamY - 7, 6, 1, C.frame);
  setPixel(canvas, apexX - 2, beamY - 8, PALETTE.cabin.shine);
  fillRect(canvas, apexX - halfWidth, eaveY + 1, halfWidth * 2 + 1, 1, roof.outline);
}

function door(canvas: PixelCanvas): void {
  const left = DOOR_CENTER - 6;
  const top = 66;
  fillRect(canvas, left - 2, top - 2, 16, WALL_BOTTOM - top + 2, C.beam);
  fillRect(canvas, left - 1, top - 1, 14, WALL_BOTTOM - top + 1, wall.outline);
  fillRect(canvas, left, top, 12, WALL_BOTTOM - top, PALETTE.cabin.door);
  for (const x of [left + 3, left + 6, left + 9]) {
    fillRect(canvas, x, top + 1, 1, WALL_BOTTOM - top - 1, PALETTE.cabin.doorDark);
  }
  fillRect(canvas, left, top, 12, 1, wall.light);
  setPixel(canvas, left + 9, top + 10, PALETTE.flowers.centerWarm);
}

/** Stone steps from the door down to the trail. */
function steps(canvas: PixelCanvas): void {
  const left = DOOR_CENTER - 6;
  for (let step = 0; step < 3; step++) {
    const y = WALL_BOTTOM + step * 3;
    const inset = 2 - step;
    fillRect(canvas, left - 3 + inset, y, 18 - inset * 2, 3, C.stoneDark);
    fillRect(canvas, left - 2 + inset, y, 16 - inset * 2, 2, C.stone);
    fillRect(canvas, left - 2 + inset, y, 16 - inset * 2, 1, C.stoneLight);
  }
}

function foundation(canvas: PixelCanvas): void {
  fillRect(canvas, 6, WALL_BOTTOM, WIDTH - 11, FOUNDATION_BOTTOM - WALL_BOTTOM + 1, C.stoneDark);
  for (let y = WALL_BOTTOM; y < FOUNDATION_BOTTOM; y += 4) {
    const offset = ((y - WALL_BOTTOM) / 4) % 2 === 0 ? 0 : 4;
    for (let x = 7 + offset; x < WIDTH - 6; x += 8) {
      fillRect(canvas, x, y, 7, 3, C.stone);
      fillRect(canvas, x, y, 7, 1, C.stoneLight);
    }
  }
}

function chimney(canvas: PixelCanvas): void {
  const left = 76;
  fillRect(canvas, left - 1, 4, 10, 22, roof.outline);
  fillRect(canvas, left, 5, 8, 20, C.stone);
  fillRect(canvas, left, 5, 8, 2, C.stoneLight);
  for (let y = 9; y < 25; y += 4) fillRect(canvas, left, y, 8, 1, C.stoneDark);
  fillRect(canvas, left + 6, 7, 2, 18, C.stoneDark);
}

export function paintCabinSprites(): SpriteSource[] {
  const canvas = createPixelCanvas(WIDTH, HEIGHT);
  tiledRoof(canvas, BACK_ROOF.left, BACK_ROOF.right, BACK_ROOF.top, GABLE.eaveY - 4);
  timberWall(canvas, WING.left, WING.right, WING.eaveY + 3, [WING.left + 12]);
  tiledRoof(canvas, WING.left - 4, WING.right + 3, WING.roofTop, WING.eaveY);
  chimney(canvas);
  shutteredWindow(canvas, WING.left + 15, WING.eaveY + 11);
  timberWall(canvas, GABLE.apexX - GABLE.halfWidth + 4, WING.left - 1, GABLE.eaveY + 2, [
    GABLE.apexX - 12,
    GABLE.apexX + 10,
  ]);
  frontGable(canvas);
  shutteredWindow(canvas, 13, 68);
  shutteredWindow(canvas, 53, 68);
  foundation(canvas);
  door(canvas);
  steps(canvas);
  return [{ key: 'cabin', frames: [canvas] }];
}
