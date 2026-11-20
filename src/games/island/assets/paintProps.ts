// Props around the cottage (16×16): barrel, flower pot, wooden sign, wood
// pile and flat stepping stones, in the same soft-outlined, top-left-lit style
// as the cottage itself.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  fillRect,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { fillEllipse, fillShape, insideEllipse, TILE_PX } from './paint';
import { PALETTE } from './palette';

/** A wooden barrel: bulging staves, two iron hoops, a dark lid seen from above. */
function barrel(): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const wood = PALETTE.dock;
  const iron = PALETTE.rock;
  const halfWidth = (y: number): number => (y >= 6 && y <= 11 ? 5 : 4);
  const inside = (x: number, y: number): boolean =>
    y >= 3 && y <= 15 && Math.abs(x + 0.5 - 8) <= halfWidth(y);
  fillShape(canvas, inside, wood.base, wood.outline);
  for (let y = 4; y <= 14; y++) {
    const left = 8 - halfWidth(y);
    const right = 7 + halfWidth(y);
    setPixel(canvas, left + 1, y, wood.light);
    setPixel(canvas, right - 1, y, wood.dark);
    setPixel(canvas, right - 2, y, wood.dark);
    for (const stave of [6, 9]) setPixel(canvas, stave, y, wood.dark);
  }
  for (const hoop of [6, 12]) {
    for (let x = 8 - halfWidth(hoop) + 1; x <= 6 + halfWidth(hoop); x++) {
      setPixel(canvas, x, hoop, x < 6 ? iron.light : iron.dark);
    }
  }
  // Lid: dark inside the rim, catching the light at its far edge.
  fillRect(canvas, 5, 4, 6, 2, wood.dark);
  fillRect(canvas, 5, 4, 6, 1, wood.outline);
  setPixel(canvas, 6, 5, wood.base);
  return canvas;
}

/** A terracotta pot with leaves and red and yellow flowers. */
function flowerPot(): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const pot = PALETTE.terracotta;
  const leaf = PALETTE.leafy;
  fillEllipse(canvas, 5.5, 7.5, 3, 2.5, leaf.dark);
  fillEllipse(canvas, 10.5, 7, 3, 2.5, leaf.dark);
  fillEllipse(canvas, 8, 5.5, 3.5, 3, leaf.base);
  fillEllipse(canvas, 7, 4.5, 1.5, 1, leaf.light);
  const blooms = [
    { x: 5, y: 6, petal: PALETTE.flowers.red },
    { x: 10, y: 5, petal: PALETTE.flowers.yellow },
    { x: 8, y: 3, petal: PALETTE.flowers.red },
  ];
  for (const { x, y, petal } of blooms) {
    setPixel(canvas, x, y - 1, petal.petal);
    setPixel(canvas, x - 1, y, petal.petal);
    setPixel(canvas, x + 1, y, petal.shade);
    setPixel(canvas, x, y + 1, petal.shade);
    setPixel(canvas, x, y, PALETTE.flowers.centerWarm);
  }
  const insidePot = (x: number, y: number): boolean => {
    if (y >= 9 && y <= 10) return x >= 3 && x <= 12; // rim
    const taper = y >= 14 ? 1 : 0;
    return y >= 11 && y <= 15 && x >= 4 + taper && x <= 11 - taper;
  };
  fillShape(canvas, insidePot, pot.base, pot.outline);
  fillRect(canvas, 4, 9, 8, 1, pot.light);
  fillRect(canvas, 4, 10, 8, 1, pot.dark);
  for (let y = 11; y <= 14; y++) {
    setPixel(canvas, 5, y, pot.light);
    setPixel(canvas, 10 - (y >= 14 ? 1 : 0), y, pot.dark);
  }
  return canvas;
}

/** A small wooden signboard on a post. */
function sign(): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const board = PALETTE.fence;
  const bark = PALETTE.bark;
  fillRect(canvas, 6, 9, 4, 7, bark.outline);
  fillRect(canvas, 7, 9, 2, 6, bark.base);
  setPixel(canvas, 7, 10, bark.light);
  fillRect(canvas, 1, 2, 14, 8, board.outline);
  fillRect(canvas, 2, 3, 12, 6, board.base);
  fillRect(canvas, 2, 3, 12, 1, board.light);
  fillRect(canvas, 2, 8, 12, 1, board.dark);
  // Carved lettering, just suggested.
  for (const [x, y, length] of [
    [4, 5, 3],
    [8, 5, 4],
    [5, 7, 5],
  ] as const) {
    fillRect(canvas, x, y, length, 1, board.outline);
  }
  setPixel(canvas, 2, 3, board.highlight);
  return canvas;
}

/** Split logs stacked three over two, cut ends facing out. */
function woodPile(): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const bark = PALETTE.bark;
  const wood = PALETTE.heartwood;
  const logs = [
    { cx: 3.5, cy: 12.5 },
    { cx: 8, cy: 12.5 },
    { cx: 12.5, cy: 12.5 },
    { cx: 5.75, cy: 8.5 },
    { cx: 10.25, cy: 8.5 },
  ];
  for (const { cx, cy } of logs) {
    fillShape(canvas, (x, y) => insideEllipse(x, y, cx, cy, 2.7, 2.7), bark.base, bark.outline);
    fillEllipse(canvas, cx, cy, 1.6, 1.6, wood.base);
    setPixel(canvas, Math.floor(cx), Math.floor(cy), wood.dark);
    setPixel(canvas, Math.floor(cx) - 1, Math.floor(cy) - 1, wood.highlight);
  }
  return canvas;
}

/** Two flat stones per tile; the layouts zigzag so a row of tiles reads as a little path. */
const STEPPING_LAYOUTS = [
  [
    { cx: 5, cy: 5, rx: 4.8, ry: 3.3 },
    { cx: 11.5, cy: 11.5, rx: 4.5, ry: 3.2 },
  ],
  [
    { cx: 4.5, cy: 11, rx: 4.5, ry: 3.2 },
    { cx: 11.5, cy: 5, rx: 4.8, ry: 3.3 },
  ],
] as const;

/** Flat stones set into the grass (walkable). */
function steppingStones(layout: (typeof STEPPING_LAYOUTS)[number]): PixelCanvas {
  const canvas = createPixelCanvas(TILE_PX, TILE_PX);
  const stone = PALETTE.rock;
  for (const { cx, cy, rx, ry } of layout) {
    fillShape(canvas, (x, y) => insideEllipse(x, y, cx, cy, rx, ry), stone.light, stone.dark);
    const left = Math.floor(cx - rx + 1);
    fillRect(canvas, left, Math.floor(cy + ry - 1), Math.ceil(rx * 2) - 2, 1, stone.base);
    setPixel(canvas, left + 1, Math.floor(cy - ry + 1), stone.highlight);
  }
  return canvas;
}

export function paintPropSprites(): SpriteSource[] {
  return [
    { key: 'barrel', frames: [barrel()] },
    { key: 'flower_pot', frames: [flowerPot()] },
    { key: 'sign', frames: [sign()] },
    { key: 'wood_pile', frames: [woodPile()] },
    ...STEPPING_LAYOUTS.map((layout, i) => ({
      key: `stepping_stone.${String(i)}`,
      frames: [steppingStones(layout)],
    })),
  ];
}
