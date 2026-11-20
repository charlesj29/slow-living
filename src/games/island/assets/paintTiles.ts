// Terrain tiles (16×16): patterned ground in a few variants so large areas
// don't look tiled, and 3-frame animation strips for water.
import { createRng, hashString, type Rng } from '@/shared/engine/random';
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  rotate90,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { fill, TILE_PX, wrappedLine } from './paint';
import { PALETTE, type Ramp } from './palette';

/** Every animated terrain sprite shares this frame count (one frame counter drives all water). */
export const WATER_FRAME_COUNT = 3;
const GROUND_VARIANTS = 3;
const WATER_VARIANTS = 2;

const tileRng = (key: string): Rng => createRng(hashString(key));

/** Picks spots spread over the tile: one per cell of a jittered grid. */
function spreadSpots(rng: Rng, cells: number, margin = 1): { x: number; y: number }[] {
  const cellSize = TILE_PX / cells;
  const spots: { x: number; y: number }[] = [];
  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      spots.push({
        x: Math.floor(cx * cellSize + rng.range(margin, cellSize - margin)),
        y: Math.floor(cy * cellSize + rng.range(margin, cellSize - margin)),
      });
    }
  }
  return spots;
}

function grassTile(rng: Rng): PixelCanvas {
  const tile = createPixelCanvas(TILE_PX, TILE_PX);
  const { dark, base, light, highlight } = PALETTE.grass;
  fill(tile, base);
  // Little "^" tufts on a jittered grid: the classic patterned-lawn look.
  for (const { x, y } of spreadSpots(rng, 3)) {
    if (rng.chance(0.25)) continue;
    setPixel(tile, x, y, dark);
    setPixel(tile, x + 1, y - 1, dark);
    setPixel(tile, x + 2, y, dark);
    setPixel(tile, x + 1, y, light);
  }
  for (let i = 0; i < 6; i++) setPixel(tile, rng.int(0, 15), rng.int(0, 15), light);
  setPixel(tile, rng.int(0, 15), rng.int(0, 15), highlight);
  return tile;
}

function sandTile(rng: Rng): PixelCanvas {
  const tile = createPixelCanvas(TILE_PX, TILE_PX);
  const { dark, base, light } = PALETTE.sand;
  fill(tile, base);
  for (const { x, y } of spreadSpots(rng, 3)) {
    if (rng.chance(0.3)) continue;
    setPixel(tile, x, y, dark);
    setPixel(tile, x + 1, y + 1, light);
  }
  for (let i = 0; i < 5; i++) setPixel(tile, rng.int(0, 15), rng.int(0, 15), light);
  return tile;
}

function pathTile(rng: Rng): PixelCanvas {
  const tile = createPixelCanvas(TILE_PX, TILE_PX);
  const { outline, dark, base, light } = PALETTE.path;
  fill(tile, base);
  for (const { x, y } of spreadSpots(rng, 2, 2)) {
    // A pebble: light top, dark underside.
    fillRect(tile, x, y, 2, 1, light);
    fillRect(tile, x, y + 1, 2, 1, dark);
    if (rng.chance(0.5)) setPixel(tile, x + 2, y + 1, outline);
  }
  for (let i = 0; i < 8; i++) {
    setPixel(tile, rng.int(0, 15), rng.int(0, 15), rng.chance(0.5) ? dark : light);
  }
  return tile;
}

/**
 * Water: a few wave glyphs (a shallow "︶" with a bright crest) that drift one
 * pixel per frame and wrap at the tile edge, so neighbouring tiles stay seamless.
 */
function waterFrames(tones: Ramp, rng: Rng): PixelCanvas[] {
  const waves = spreadSpots(rng, 2, 2).map((spot) => ({ ...spot, length: rng.int(4, 6) }));
  const glints = Array.from({ length: 3 }, () => ({ x: rng.int(0, 15), y: rng.int(0, 15) }));
  return Array.from({ length: WATER_FRAME_COUNT }, (_, frame) => {
    const tile = createPixelCanvas(TILE_PX, TILE_PX);
    fill(tile, tones.base);
    for (const wave of waves) {
      const x = wave.x + frame;
      setPixel(tile, x % TILE_PX, wave.y, tones.light);
      wrappedLine(tile, x + 1, wave.y + 1, wave.length - 2, tones.light);
      setPixel(tile, (x + wave.length - 1) % TILE_PX, wave.y, tones.light);
      setPixel(tile, (x + 2) % TILE_PX, wave.y + 1, tones.highlight);
      wrappedLine(tile, x + 1, wave.y + 2, wave.length - 2, tones.dark);
    }
    for (const glint of glints) {
      if ((glint.x + frame) % 3 === 0) setPixel(tile, glint.x, glint.y, tones.highlight);
    }
    return tile;
  });
}

/** Painted for a dock running north–south (boards across); rotated for east–west. */
function dockTile(horizontal: boolean): PixelCanvas {
  const tile = createPixelCanvas(TILE_PX, TILE_PX);
  const { outline, dark, base, light } = PALETTE.dock;
  const left = 3;
  const width = TILE_PX - 6;
  for (let y = 0; y < TILE_PX; y++) {
    const row = y % 4;
    const tone = row === 3 ? outline : row === 0 ? light : row === 2 ? dark : base;
    fillRect(tile, left, y, width, 1, tone);
  }
  fillRect(tile, left - 1, 0, 1, TILE_PX, outline);
  fillRect(tile, left + width, 0, 1, TILE_PX, outline);
  // Posts beside the planks.
  for (const x of [left - 2, left + width + 1]) {
    fillRect(tile, x, 5, 1, 4, PALETTE.bark.outline);
    setPixel(tile, x, 5, PALETTE.bark.light);
  }
  return horizontal ? rotate90(tile) : tile;
}

function variants(key: string, count: number, paint: (rng: Rng) => PixelCanvas[]): SpriteSource[] {
  return Array.from({ length: count }, (_, i) => {
    const variantKey = `${key}.${String(i)}`;
    return { key: variantKey, frames: paint(tileRng(variantKey)) };
  });
}

export function paintTileSprites(): SpriteSource[] {
  return [
    ...variants('tile_grass', GROUND_VARIANTS, (rng) => [grassTile(rng)]),
    ...variants('tile_sand', GROUND_VARIANTS, (rng) => [sandTile(rng)]),
    ...variants('tile_path', GROUND_VARIANTS, (rng) => [pathTile(rng)]),
    ...variants('tile_deep_sea', WATER_VARIANTS, (rng) => waterFrames(PALETTE.deepSea, rng)),
    ...variants('tile_shallow_sea', WATER_VARIANTS, (rng) => waterFrames(PALETTE.shallowSea, rng)),
    ...variants('tile_lake_water', WATER_VARIANTS, (rng) => waterFrames(PALETTE.lakeWater, rng)),
    ...variants('tile_lake_shallow', WATER_VARIANTS, (rng) =>
      waterFrames(PALETTE.lakeShallow, rng),
    ),
    { key: 'tile_dock_v', frames: [dockTile(false)] },
    { key: 'tile_dock_h', frames: [dockTile(true)] },
  ];
}
