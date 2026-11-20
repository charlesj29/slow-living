// Terrain tiles (16×16): a few variants each so large areas don't look tiled,
// and animation strips for water.
import { createRng, hashString, type Rng } from '@/shared/engine/random';
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  rotate90,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';
import { fill, speckle, TILE_PX, wrappedLine } from './paint';
import { PALETTE } from './palette';

/** Every animated sprite shares this frame count (the tilemap uses one frame counter). */
export const WATER_FRAME_COUNT = 3;
const GROUND_VARIANTS = 3;
const WATER_VARIANTS = 2;

function tileRng(key: string): Rng {
  return createRng(hashString(key));
}

function grassTile(rng: Rng): PixelCanvas {
  const tile = createPixelCanvas(TILE_PX, TILE_PX);
  const { base, light, dark, blade } = PALETTE.grass;
  fill(tile, base);
  speckle(tile, rng, light, 14);
  speckle(tile, rng, dark, 10);
  for (let i = 0; i < 3; i++) {
    const x = rng.int(1, TILE_PX - 2);
    const y = rng.int(2, TILE_PX - 2);
    setPixel(tile, x, y, blade);
    setPixel(tile, x, y - 1, blade);
    setPixel(tile, x + 1, y, light);
  }
  return tile;
}

function sandTile(rng: Rng): PixelCanvas {
  const tile = createPixelCanvas(TILE_PX, TILE_PX);
  const { base, light, dark } = PALETTE.sand;
  fill(tile, base);
  speckle(tile, rng, light, 12);
  speckle(tile, rng, dark, 8);
  return tile;
}

function pathTile(rng: Rng): PixelCanvas {
  const tile = createPixelCanvas(TILE_PX, TILE_PX);
  const { base, light, dark, pebble } = PALETTE.path;
  fill(tile, base);
  speckle(tile, rng, light, 10);
  speckle(tile, rng, dark, 10);
  for (let i = 0; i < 2; i++) {
    const x = rng.int(1, TILE_PX - 3);
    const y = rng.int(1, TILE_PX - 2);
    fillRect(tile, x, y, 2, 1, pebble);
  }
  return tile;
}

interface WaterColors {
  readonly base: Rgba;
  readonly light: Rgba;
  readonly wave: Rgba;
}

/**
 * Water frames: soft light patches plus short wave crests that drift one pixel
 * per frame and wrap at the tile edge, so neighbouring tiles stay seamless.
 */
function waterFrames(colors: WaterColors, rng: Rng): PixelCanvas[] {
  const crests = Array.from({ length: 4 }, () => ({
    x: rng.int(0, TILE_PX - 1),
    y: rng.int(1, TILE_PX - 2),
    length: rng.int(2, 4),
  }));
  const patches = Array.from({ length: 10 }, () => ({
    x: rng.int(0, TILE_PX - 1),
    y: rng.int(0, TILE_PX - 1),
  }));
  return Array.from({ length: WATER_FRAME_COUNT }, (_, frame) => {
    const tile = createPixelCanvas(TILE_PX, TILE_PX);
    fill(tile, colors.base);
    for (const patch of patches) setPixel(tile, patch.x, patch.y, colors.light);
    for (const crest of crests)
      wrappedLine(tile, crest.x + frame, crest.y, crest.length, colors.wave);
    return tile;
  });
}

function dockTile(horizontal: boolean): PixelCanvas {
  // Painted for a dock running north–south; rotated copies cover east–west.
  const tile = createPixelCanvas(TILE_PX, TILE_PX);
  const { plank, light, gap, post } = PALETTE.dock;
  const left = 2;
  const width = TILE_PX - 4;
  for (let y = 0; y < TILE_PX; y++) {
    const isGap = y % 4 === 3;
    fillRect(tile, left, y, width, 1, isGap ? gap : plank);
    if (!isGap && y % 4 === 0) fillRect(tile, left + 1, y, width - 2, 1, light);
  }
  fillRect(tile, left, 0, 1, TILE_PX, gap);
  fillRect(tile, left + width - 1, 0, 1, TILE_PX, gap);
  setPixel(tile, left, 1, post);
  setPixel(tile, left + width - 1, 1, post);
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
