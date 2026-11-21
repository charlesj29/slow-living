// The cottage look, shared by the village houses and the studio: a tiled (or
// thatched) back roof, a timber-framed front gable over the door, shuttered
// windows with flower boxes, a stone base with steps, a chimney and a lantern.
// Each building is a spec; the painter draws it back to front. Light comes from
// the top-left: left roof planes are lit, right ones shaded. Glass glows at night.
import {
  createPixelCanvas,
  fillRect,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';
import { PALETTE, type Ramp } from './palette';

export type WallStyle = 'plaster' | 'stone' | 'log';

export interface CottageSpec {
  readonly width: number;
  readonly height: number;
  /** Where the door is centred (the footprint's door tile). */
  readonly doorCenterX: number;
  readonly wallTop: number;
  readonly wallBottom: number;
  readonly roof: Ramp;
  readonly thatched: boolean;
  readonly walls: WallStyle;
  /** Timber posts on plaster walls (x of each). */
  readonly posts: readonly number[];
  readonly backRoof: { readonly left: number; readonly right: number; readonly top: number };
  readonly gable: {
    readonly apexY: number;
    readonly eaveY: number;
    readonly halfWidth: number;
    readonly thickness: number;
  };
  /** Top-left corners of the shuttered windows. */
  readonly windows: readonly { readonly left: number; readonly top: number }[];
  readonly windowSize: number;
  readonly chimney: { readonly left: number; readonly top: number } | null;
  readonly lantern: { readonly x: number; readonly y: number } | null;
}

const O = PALETTE.wall.outline;
const C = PALETTE.cottage;
const CHIMNEY = { width: 8, height: 20 } as const;
const DOOR = { width: 12, height: 18 } as const;

/** Rows of roof tiles with staggered seams (or straw strokes for thatch). */
function backRoof(c: PixelCanvas, spec: CottageSpec): void {
  const { left, right, top } = spec.backRoof;
  const bottom = spec.gable.eaveY - 2;
  const r = spec.roof;
  for (let y = top; y <= bottom; y++) {
    const row = (y - top) % 5;
    if (spec.thatched) {
      for (let x = left; x <= right; x++) {
        const stroke = (x * 7 + Math.floor((y - top) / 3)) % 5 === 0;
        setPixel(c, x, y, stroke ? r.dark : y - top < 4 ? r.light : r.base);
      }
      continue;
    }
    fillRect(c, left, y, right - left + 1, 1, row === 0 ? r.light : row === 4 ? r.dark : r.base);
    if (row > 0 && row < 4) {
      const offset = Math.floor((y - top) / 5) % 2 === 0 ? 3 : 7;
      for (let x = left + offset; x <= right; x += 8) setPixel(c, x, y, r.dark);
    }
  }
  fillRect(c, left, top - 1, right - left + 1, 1, r.outline);
  fillRect(c, left, bottom + 1, right - left + 1, 2, r.outline);
  fillRect(c, left - 1, top - 1, 1, bottom - top + 4, r.outline);
  fillRect(c, right + 1, top - 1, 1, bottom - top + 4, r.outline);
  if (spec.thatched) fillRect(c, left, bottom - 1, right - left + 1, 2, r.light); // a thick eave
}

function chimney(c: PixelCanvas, spec: CottageSpec): void {
  if (!spec.chimney) return;
  const { left, top } = spec.chimney;
  fillRect(c, left - 1, top - 1, CHIMNEY.width + 2, CHIMNEY.height + 2, spec.roof.outline);
  fillRect(c, left, top, CHIMNEY.width, CHIMNEY.height, C.stone);
  fillRect(c, left, top, CHIMNEY.width, 2, C.stoneLight);
  for (let y = top + 4; y < top + CHIMNEY.height; y += 4)
    fillRect(c, left, y, CHIMNEY.width, 1, C.stoneDark);
  fillRect(c, left + CHIMNEY.width - 2, top + 2, 2, CHIMNEY.height - 2, C.stoneDark);
}

/** The chimney's top centre, where smoke rises from (sprite pixels). */
export function chimneyTop(spec: CottageSpec): { x: number; y: number } | null {
  return spec.chimney
    ? { x: spec.chimney.left + CHIMNEY.width / 2, y: spec.chimney.top - 1 }
    : null;
}

function walls(c: PixelCanvas, spec: CottageSpec): void {
  const left = 4;
  const right = spec.width - 5;
  const { wallTop: top, wallBottom: bottom } = spec;
  for (let y = top; y < bottom; y++) {
    for (let x = left; x <= right; x++) {
      const row = y - top;
      let color: Rgba = C.plaster;
      if (spec.walls === 'stone') {
        const shifted = x + (Math.floor(row / 5) % 2) * 4;
        color =
          row % 5 === 4 || shifted % 8 === 0 ? C.stoneDark : row % 5 === 0 ? C.stoneLight : C.stone;
      } else if (spec.walls === 'log') {
        const band = row % 4;
        color =
          band === 3 ? PALETTE.bark.outline : band === 0 ? PALETTE.bark.light : PALETTE.bark.base;
      } else if ((x * 5 + row * 11) % 37 === 0) {
        color = C.plasterLight;
      }
      setPixel(c, x, y, color);
    }
  }
  if (spec.walls === 'log') {
    for (let y = top; y < bottom; y += 4) {
      for (const x of [left, right]) {
        setPixel(c, x, y + 1, PALETTE.heartwood.base);
        setPixel(c, x, y + 2, PALETTE.heartwood.dark);
      }
    }
  }
  // Timber: a beam along the top and posts (plaster walls), as on the cottage.
  fillRect(c, left, top, right - left + 1, 2, C.beam);
  fillRect(c, left, top + 2, right - left + 1, 1, C.beamDark);
  if (spec.walls === 'plaster') {
    for (const x of spec.posts) {
      fillRect(c, x, top, 2, bottom - top, C.beam);
      setPixel(c, x + 1, top + 2, C.beamDark);
    }
    fillRect(c, left, top + 3, 1, bottom - top - 3, C.plasterLight);
  }
  fillRect(c, left - 1, top, 1, bottom - top, O);
  fillRect(c, right + 1, top, 1, bottom - top, O);
}

/** A window with a cross frame, shutters either side and a flower box below. */
function shutteredWindow(c: PixelCanvas, left: number, top: number, size: number): void {
  fillRect(c, left - 1, top - 1, size + 2, size + 2, O);
  fillRect(c, left, top, size, size, PALETTE.cabin.glass);
  fillRect(c, left, top, size, 1, C.frame);
  fillRect(c, left + Math.floor(size / 2), top, 1, size, C.frame);
  fillRect(c, left, top + Math.floor(size / 2), size, 1, C.frame);
  setPixel(c, left + 1, top + 1, PALETTE.cabin.shine);
  setPixel(c, left + 2, top + 1, PALETTE.cabin.shine);
  setPixel(c, left + 1, top + 2, PALETTE.cabin.shine);
  for (const x of [left - 4, left + size + 1]) {
    fillRect(c, x, top - 1, 3, size + 2, C.shutter);
    fillRect(c, x, top - 1, 3, 1, C.shutterLight);
    fillRect(c, x + 1, top + 1, 1, size - 2, C.shutterDark);
  }
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
}

/** The A-shaped front gable: a timbered triangle inside two roof planes. */
function frontGable(c: PixelCanvas, spec: CottageSpec): void {
  const { apexY, eaveY, halfWidth, thickness } = spec.gable;
  const apexX = spec.doorCenterX;
  const r = spec.roof;
  const slope = halfWidth / (eaveY - apexY);
  const infill = spec.walls === 'log' ? PALETTE.bark.base : C.plaster;
  for (let y = apexY; y <= eaveY; y++) {
    const half = (y - apexY) * slope;
    const innerHalf = half - thickness;
    if (innerHalf > 0)
      fillRect(c, Math.round(apexX - innerHalf), y, Math.round(innerHalf * 2), 1, infill);
    for (const side of [-1, 1]) {
      const outer = apexX + side * half;
      const inner = apexX + side * Math.max(0, innerHalf);
      const from = Math.round(Math.min(outer, inner));
      const to = Math.round(Math.max(outer, inner));
      const lit = side < 0;
      for (let x = from; x <= to; x++) {
        let tone = lit ? r.base : r.dark;
        if (spec.thatched) {
          tone = (x * 3 + y) % 6 === 0 ? r.dark : lit ? r.light : r.base;
        } else {
          const along = (y + Math.abs(x - apexX)) % 5;
          if (along === 0) tone = lit ? r.highlight : r.light;
          else if (along === 4) tone = r.dark;
        }
        setPixel(c, x, y, tone);
      }
      setPixel(c, Math.round(outer), y, r.outline);
      setPixel(c, Math.round(outer) + side, y, r.outline);
      if (innerHalf > 0) setPixel(c, Math.round(inner), y, r.dark);
    }
  }
  // Timber in the gable: king post, crossbeam, braces.
  const beamY = eaveY - Math.round((eaveY - apexY) * 0.3);
  fillRect(c, apexX - 1, apexY + thickness + 2, 2, eaveY - apexY - thickness - 2, C.beam);
  const beamHalf = (beamY - apexY) * slope - thickness;
  fillRect(c, Math.round(apexX - beamHalf), beamY, Math.round(beamHalf * 2), 2, C.beam);
  const braces = Math.max(0, eaveY - beamY - 3);
  for (let i = 0; i < braces; i++) {
    setPixel(c, apexX - 2 - i, beamY + 2 + i, C.beam);
    setPixel(c, apexX + 1 + i, beamY + 2 + i, C.beam);
  }
  fillRect(c, apexX - halfWidth, eaveY + 1, halfWidth * 2 + 1, 1, r.outline);
}

/** A small attic window in the gable, above the crossbeam. */
export function atticWindow(c: PixelCanvas, spec: CottageSpec): void {
  const { apexY, eaveY } = spec.gable;
  const apexX = spec.doorCenterX;
  const beamY = eaveY - Math.round((eaveY - apexY) * 0.3);
  fillRect(c, apexX - 4, beamY - 9, 8, 7, O);
  fillRect(c, apexX - 3, beamY - 8, 6, 5, PALETTE.cabin.glass);
  fillRect(c, apexX - 3, beamY - 6, 6, 1, C.frame);
  setPixel(c, apexX - 2, beamY - 7, PALETTE.cabin.shine);
}

function door(c: PixelCanvas, spec: CottageSpec): void {
  const left = spec.doorCenterX - DOOR.width / 2;
  const top = spec.wallBottom - DOOR.height;
  fillRect(c, left - 2, top - 2, DOOR.width + 4, DOOR.height + 2, C.beam);
  fillRect(c, left - 1, top - 1, DOOR.width + 2, DOOR.height + 1, O);
  fillRect(c, left, top, DOOR.width, DOOR.height, PALETTE.cabin.door);
  for (const x of [left + 3, left + 6, left + 9]) {
    fillRect(c, x, top + 1, 1, DOOR.height - 1, PALETTE.cabin.doorDark);
  }
  fillRect(c, left, top, DOOR.width, 1, PALETTE.wall.light);
  setPixel(c, left + 9, top + 10, PALETTE.flowers.centerWarm);
}

function foundationAndSteps(c: PixelCanvas, spec: CottageSpec): void {
  const bottom = spec.height - 3;
  const y0 = spec.wallBottom;
  fillRect(c, 3, y0, spec.width - 6, bottom - y0 + 1, C.stoneDark);
  for (let y = y0; y < bottom; y += 4) {
    const offset = ((y - y0) / 4) % 2 === 0 ? 0 : 4;
    for (let x = 4 + offset; x < spec.width - 4; x += 8) {
      fillRect(c, x, y, 7, 3, C.stone);
      fillRect(c, x, y, 7, 1, C.stoneLight);
    }
  }
  const left = spec.doorCenterX - DOOR.width / 2;
  for (let step = 0; step < 2; step++) {
    const y = y0 + step * 3;
    const inset = 1 - step;
    fillRect(c, left - 3 + inset, y, 18 - inset * 2, 3, C.stoneDark);
    fillRect(c, left - 2 + inset, y, 16 - inset * 2, 2, C.stone);
    fillRect(c, left - 2 + inset, y, 16 - inset * 2, 1, C.stoneLight);
  }
}

function lantern(c: PixelCanvas, spec: CottageSpec): void {
  if (!spec.lantern) return;
  const { x, y } = spec.lantern;
  fillRect(c, x - 1, y, 8, 2, PALETTE.bark.outline);
  fillRect(c, x, y + 2, 6, 8, O);
  fillRect(c, x + 1, y + 4, 4, 5, PALETTE.cabin.glass);
  setPixel(c, x + 2, y + 5, PALETTE.cabin.shine);
}

/**
 * Paints a building in the cottage style. `extras` draws building-specific
 * details last (a sign, a skylight) on top of everything else.
 */
export function paintCottage(spec: CottageSpec, extras?: (c: PixelCanvas) => void): PixelCanvas {
  const c = createPixelCanvas(spec.width, spec.height);
  backRoof(c, spec);
  chimney(c, spec);
  walls(c, spec);
  for (const w of spec.windows) shutteredWindow(c, w.left, w.top, spec.windowSize);
  frontGable(c, spec);
  foundationAndSteps(c, spec);
  door(c, spec);
  lantern(c, spec);
  extras?.(c);
  return c;
}
