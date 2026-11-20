// Rocky ledges (16×16 terrain tiles): a sandstone face where the grass drops
// to the beach. A grass lip on top (its turf edge hangs over the rock), then
// two rows of rounded boulders lit from the top-left (the same clump shading
// as rocks), then the beach in the face's shadow. Run ends round off against
// whatever is beside them, grass or beach: see `cliffPieceKey`.
import { createRng, hashString, type Rng } from '@/shared/engine/random';
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  getPixel,
  isOpaqueAt,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { paintClumps, type Clump } from './foliage';
import { fill, TILE_PX } from './paint';
import { PALETTE } from './palette';

/** What lies beside a ledge tile: more ledge, grass, or beach. */
export type CliffSide = 'ledge' | 'grass' | 'sand';
const SIDE_CODE: Readonly<Record<CliffSide, string>> = { ledge: 'c', grass: 'g', sand: 's' };
const SIDES: readonly CliffSide[] = ['ledge', 'grass', 'sand'];

/** `tile_cliff` for a middle piece, else `tile_cliff_<west><east>` (c ledge, g grass, s sand). */
export function cliffPieceKey(west: CliffSide, east: CliffSide): string {
  if (west === 'ledge' && east === 'ledge') return 'tile_cliff';
  return `tile_cliff_${SIDE_CODE[west]}${SIDE_CODE[east]}`;
}

const MIDDLE_VARIANTS = 3;
const END_VARIANTS = 2;
/** Boulders are painted on a wider canvas so the tile's sides show no outline (runs join up). */
const PAD = TILE_PX;
/** Rows of the turf that tops the face. */
const LIP_ROWS = 2;
/** Back row (higher up) and front row of boulders: centre row and radius range. */
const BOULDER_ROWS = [
  { cy: 5.5, minR: 3.8, maxR: 4.8, spacing: 5.5, offset: 0 },
  { cy: 9.6, minR: 3.8, maxR: 4.5, spacing: 5.5, offset: 2.75 },
] as const;
/** Open ends: no boulder centre closer to the open side than this. */
const END_MARGIN = 5;

/** Boulder clumps in tile coordinates, repeated every tile width so a run of one variant is seamless. */
function boulders(rng: Rng, west: CliffSide, east: CliffSide): Clump[] {
  const clumps: Clump[] = [];
  for (const row of BOULDER_ROWS) {
    for (let x = row.offset; x < TILE_PX; x += row.spacing) {
      const cx = x + rng.range(-0.8, 0.8);
      const cy = row.cy + rng.range(-0.6, 0.6);
      const r = rng.range(row.minR, row.maxR);
      for (const shift of [-TILE_PX, 0, TILE_PX]) clumps.push({ cx: cx + shift, cy, r });
    }
  }
  return clumps.filter(
    ({ cx }) =>
      (west === 'ledge' || cx >= END_MARGIN) && (east === 'ledge' || cx <= TILE_PX - END_MARGIN),
  );
}

/** Paints the boulders on a padded canvas and returns which tile pixels are rock. */
function paintFace(canvas: PixelCanvas, clumps: readonly Clump[]): boolean[][] {
  const wide = createPixelCanvas(TILE_PX + PAD * 2, TILE_PX);
  paintClumps(
    wide,
    clumps.map((c) => ({ ...c, cx: c.cx + PAD })),
    PALETTE.cliff,
  );
  const rock: boolean[][] = [];
  for (let x = 0; x < TILE_PX; x++) {
    const column: boolean[] = [];
    for (let y = 0; y < TILE_PX; y++) {
      const isRock = y >= LIP_ROWS && isOpaqueAt(wide, x + PAD, y);
      column.push(isRock);
      if (isRock) setPixel(canvas, x, y, getPixel(wide, x + PAD, y));
    }
    rock.push(column);
  }
  return rock;
}

function cliffTile(rng: Rng, west: CliffSide, east: CliffSide): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const { grass, sand } = PALETTE;
  fill(canvas, grass.base);
  for (let i = 0; i < 4; i++) setPixel(canvas, rng.int(0, 15), rng.int(0, LIP_ROWS), grass.light);
  // Beside an end that opens onto the beach, the ground below the turf is sand.
  for (let y = LIP_ROWS; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      if ((x < TILE_PX / 2 ? west : east) === 'sand') setPixel(canvas, x, y, sand.base);
    }
  }

  const rock = paintFace(canvas, boulders(rng, west, east));
  rock.forEach((column, x) => {
    const top = column.indexOf(true);
    const bottom = column.lastIndexOf(true);
    if (top < 0) return;
    // The turf's edge hangs over the top of the rock, with the odd blade dangling.
    setPixel(canvas, x, top, grass.dark);
    if (rng.chance(0.3)) setPixel(canvas, x, top + 1, grass.dark);
    // Beach below the face (only there: an end beside grass stays grass), shaded at the foot.
    for (let y = bottom + 1; y < TILE_PX; y++) {
      const shaded = y === bottom + 1 || (y === bottom + 2 && x % 2 === 0);
      setPixel(canvas, x, y, shaded ? sand.dark : sand.base);
    }
  });
  return canvas;
}

export function paintCliffSprites(): SpriteSource[] {
  return SIDES.flatMap((west) =>
    SIDES.flatMap((east) => {
      const key = cliffPieceKey(west, east);
      const count = key === 'tile_cliff' ? MIDDLE_VARIANTS : END_VARIANTS;
      return Array.from({ length: count }, (_, i) => {
        const variantKey = `${key}.${String(i)}`;
        return {
          key: variantKey,
          frames: [cliffTile(createRng(hashString(variantKey)), west, east)],
        };
      });
    }),
  );
}
