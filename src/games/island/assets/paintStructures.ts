// Man-made bits around the cabin: a picket fence that connects to its
// neighbours (one sprite per connection pattern) and a mailbox.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { TILE_PX } from './paint';
import { PALETTE } from './palette';

/** Sprite key for a fence piece connected towards the given sides, e.g. `fence_ew`, `fence_ns`. */
export function fenceSpriteKey(
  north: boolean,
  east: boolean,
  south: boolean,
  west: boolean,
): string {
  const sides = `${north ? 'n' : ''}${east ? 'e' : ''}${south ? 's' : ''}${west ? 'w' : ''}`;
  return sides === '' ? 'fence' : `fence_${sides}`;
}

const POST_LEFT = 6;
const POST_WIDTH = 4;
const POST_TOP = 3;
const POST_BOTTOM = 14;
const RAIL_ROWS = [6, 10] as const;

function paintRailH(canvas: PixelCanvas, fromX: number, toX: number): void {
  const { outline, base, light } = PALETTE.fence;
  for (const y of RAIL_ROWS) {
    fillRect(canvas, fromX, y - 1, toX - fromX, 1, outline);
    fillRect(canvas, fromX, y, toX - fromX, 1, light);
    fillRect(canvas, fromX, y + 1, toX - fromX, 1, base);
    fillRect(canvas, fromX, y + 2, toX - fromX, 1, outline);
  }
}

function paintRailV(canvas: PixelCanvas, fromY: number, toY: number): void {
  const { outline, base, light } = PALETTE.fence;
  fillRect(canvas, POST_LEFT, fromY, 1, toY - fromY, outline);
  fillRect(canvas, POST_LEFT + 1, fromY, 1, toY - fromY, light);
  fillRect(canvas, POST_LEFT + 2, fromY, 1, toY - fromY, base);
  fillRect(canvas, POST_LEFT + 3, fromY, 1, toY - fromY, outline);
}

function paintPost(canvas: PixelCanvas): void {
  const { outline, dark, base, light, highlight } = PALETTE.fence;
  fillRect(canvas, POST_LEFT - 1, POST_TOP, POST_WIDTH + 2, POST_BOTTOM - POST_TOP + 2, outline);
  fillRect(canvas, POST_LEFT, POST_TOP + 1, POST_WIDTH, POST_BOTTOM - POST_TOP, base);
  fillRect(canvas, POST_LEFT, POST_TOP + 1, 1, POST_BOTTOM - POST_TOP, light);
  fillRect(canvas, POST_LEFT + POST_WIDTH - 1, POST_TOP + 1, 1, POST_BOTTOM - POST_TOP, dark);
  fillRect(canvas, POST_LEFT, POST_TOP + 1, POST_WIDTH, 1, highlight); // cap catches the light
}

function fencePiece(north: boolean, east: boolean, south: boolean, west: boolean): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  if (west) paintRailH(canvas, 0, POST_LEFT);
  if (east) paintRailH(canvas, POST_LEFT + POST_WIDTH, TILE_PX);
  if (north) paintRailV(canvas, 0, POST_TOP);
  if (south) paintRailV(canvas, POST_BOTTOM + 1, TILE_PX);
  paintPost(canvas);
  return canvas;
}

/** 16×24: a red mailbox with a yellow flag on a wooden post. */
function mailbox(): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX + 8);
  const { body, dark, light, flag } = PALETTE.mailbox;
  const bark = PALETTE.bark;
  fillRect(canvas, 6, 11, 4, 12, bark.outline);
  fillRect(canvas, 7, 11, 2, 11, bark.base);
  setPixel(canvas, 7, 11, bark.light);
  fillRect(canvas, 2, 3, 12, 9, PALETTE.wall.outline);
  fillRect(canvas, 3, 4, 10, 7, body);
  fillRect(canvas, 3, 4, 10, 1, light);
  fillRect(canvas, 3, 10, 10, 1, dark);
  fillRect(canvas, 12, 4, 1, 7, dark);
  fillRect(canvas, 4, 6, 3, 2, dark); // slot
  fillRect(canvas, 13, 1, 2, 6, PALETTE.wall.outline);
  fillRect(canvas, 13, 1, 2, 2, flag);
  return canvas;
}

export function paintStructureSprites(): SpriteSource[] {
  const sources: SpriteSource[] = [];
  for (let mask = 0; mask < 16; mask++) {
    const [north, east, south, west] = [1, 2, 4, 8].map((bit) => (mask & bit) !== 0) as [
      boolean,
      boolean,
      boolean,
      boolean,
    ];
    sources.push({
      key: fenceSpriteKey(north, east, south, west),
      frames: [fencePiece(north, east, south, west)],
    });
  }
  sources.push({ key: 'mailbox', frames: [mailbox()] });
  return sources;
}
