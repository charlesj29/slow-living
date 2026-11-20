// Smooth shorelines. Where a higher-priority tile meets a lower one, the lower
// tile gets an overlay of the higher material along that edge (or a rounded
// outer corner when they only touch diagonally). Overlays are transparent
// elsewhere, so the base tile (even animated water) shows through.
//
// Keys: `edge_<material>_<n|e|s|w>.<v>` and `corner_<material>_<ne|se|sw|nw>.<v>`,
// where <material> is the tile key of the higher tile and <v> a variant (two
// per piece, so long edges don't repeat).
import { createRng, hashString, type Rng } from '@/shared/engine/random';
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  rotateTimes,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';
import { TILE_PX } from './paint';
import { PALETTE } from './palette';

interface EdgeStyle {
  /** How far the material reaches into the lower tile, in pixels. */
  readonly depth: number;
  readonly fill: Rgba;
  readonly speckle: Rgba;
  /** Drawn just outside the material (e.g. foam on water); optional. */
  readonly fringe?: Rgba;
  /** A broken second line beyond the fringe (softer foam). */
  readonly softFringe?: Rgba;
  /** Drawn on the material's own outermost row (e.g. a darker grass rim). */
  readonly rim?: Rgba;
  /** Checkerboard the outermost row so water-on-water blends softly. */
  readonly dither?: boolean;
  /** How far (px) the boundary wanders in and out; bigger = more natural, irregular edge. */
  readonly wobble: number;
  /** Chance per column of a blade poking out past the boundary (grass onto dirt/sand). */
  readonly bladeChance?: number;
  readonly blade?: Rgba;
}

const EDGE_VARIANTS = 2;

const EDGE_STYLES: Readonly<Record<string, EdgeStyle>> = {
  sand: {
    depth: 4,
    fill: PALETTE.sand.base,
    speckle: PALETTE.sand.light,
    fringe: PALETTE.foam.bright,
    softFringe: PALETTE.foam.soft,
    wobble: 1,
  },
  grass: {
    depth: 3,
    fill: PALETTE.grass.base,
    speckle: PALETTE.grass.light,
    rim: PALETTE.grass.dark,
    // A soft shadow line on the ground just below the grass edge.
    fringe: PALETTE.path.dark,
    wobble: 2,
    bladeChance: 0.3,
    blade: PALETTE.grass.dark,
  },
  shallow_sea: {
    depth: 3,
    fill: PALETTE.shallowSea.base,
    speckle: PALETTE.shallowSea.light,
    dither: true,
    wobble: 1,
  },
  lake_shallow: {
    depth: 3,
    fill: PALETTE.lakeShallow.base,
    speckle: PALETTE.lakeShallow.light,
    dither: true,
    wobble: 1,
  },
};

/** Materials that have shoreline overlays. */
export const EDGE_MATERIALS: readonly string[] = Object.keys(EDGE_STYLES);

const EDGE_DIRECTIONS = ['n', 'e', 's', 'w'] as const;
const CORNER_DIRECTIONS = ['ne', 'se', 'sw', 'nw'] as const;

/** Paints a pixel column/row band given the material depth at that position. */
function paintBand(
  canvas: PixelCanvas,
  style: EdgeStyle,
  rng: Rng,
  x: number,
  depth: number,
): void {
  for (let y = 0; y < depth; y++) {
    const outermost = y === depth - 1;
    if (outermost && style.dither && (x + y) % 2 === 1) continue;
    const color =
      outermost && style.rim ? style.rim : rng.chance(0.15) ? style.speckle : style.fill;
    setPixel(canvas, x, y, color);
  }
  if (style.blade && style.bladeChance && rng.chance(style.bladeChance)) {
    // A blade overhangs the edge: the shadow line moves down under it.
    setPixel(canvas, x, depth, style.blade);
    if (style.fringe) setPixel(canvas, x, depth + 1, style.fringe);
  } else if (style.fringe) {
    setPixel(canvas, x, depth, style.fringe);
  }
  if (style.softFringe && x % 3 !== 2) setPixel(canvas, x, depth + 1, style.softFringe);
}

/** North-facing edge: the material hugs the top of the tile with a gently wavy boundary. */
function northEdge(style: EdgeStyle, rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  // Smooth wobble that returns to the base depth at both ends so tiles join seamlessly.
  const phase = rng.range(0, Math.PI * 2);
  for (let x = 0; x < TILE_PX; x++) {
    const wobble = Math.round(
      style.wobble *
        Math.sin((x / TILE_PX) * Math.PI * 2 + phase) *
        Math.sin((x / TILE_PX) * Math.PI),
    );
    paintBand(canvas, style, rng, x, style.depth + wobble);
  }
  return canvas;
}

/** North-east outer corner: a quarter disc in the top-right corner. */
function northEastCorner(style: EdgeStyle, rng: Rng): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const radius = style.depth + 0.5;
  for (let y = 0; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      const distance = Math.hypot(x + 0.5 - TILE_PX, y + 0.5);
      if (distance < radius - 1) {
        const outermost = distance >= radius - 2;
        if (outermost && style.dither && (x + y) % 2 === 1) continue;
        setPixel(
          canvas,
          x,
          y,
          outermost && style.rim ? style.rim : rng.chance(0.15) ? style.speckle : style.fill,
        );
      } else if (style.fringe && distance < radius) {
        setPixel(canvas, x, y, style.fringe);
      } else if (style.softFringe && distance < radius + 1 && (x + y) % 3 !== 2) {
        setPixel(canvas, x, y, style.softFringe);
      }
    }
  }
  return canvas;
}

export function paintTransitionSprites(): SpriteSource[] {
  const sources: SpriteSource[] = [];
  for (const material of EDGE_MATERIALS) {
    const style = EDGE_STYLES[material];
    if (!style) continue;
    for (let variant = 0; variant < EDGE_VARIANTS; variant++) {
      const rng = createRng(hashString(`edge_${material}.${String(variant)}`));
      const edge = northEdge(style, rng);
      const corner = northEastCorner(style, rng);
      EDGE_DIRECTIONS.forEach((direction, turns) => {
        sources.push({
          key: `edge_${material}_${direction}.${String(variant)}`,
          frames: [rotateTimes(edge, turns)],
        });
      });
      CORNER_DIRECTIONS.forEach((direction, turns) => {
        sources.push({
          key: `corner_${material}_${direction}.${String(variant)}`,
          frames: [rotateTimes(corner, turns)],
        });
      });
    }
  }
  return sources;
}
