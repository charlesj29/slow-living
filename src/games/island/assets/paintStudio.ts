// The Developer's Studio in the cottage style (112×96 over a 7×4 footprint;
// the roof rises two tiles above it): the cottage's front gable, timber and
// shuttered windows, but bigger, with a teal roof, a skylight, a chimney, a
// lantern and a hanging "</>" sign over the door. Glass glows at night.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import { fillRect, setPixel, type PixelCanvas } from '@/shared/render/pixelCanvas';
import { atticWindow, chimneyTop, paintCottage, type CottageSpec } from './cottageStyle';
import { PALETTE } from './palette';

const O = PALETTE.wall.outline;

export const STUDIO_SPEC: CottageSpec = {
  width: 112,
  height: 96,
  doorCenterX: 56, // the footprint's fourth tile, matching the registry's door
  wallTop: 60,
  wallBottom: 90,
  roof: PALETTE.teal,
  thatched: false,
  walls: 'plaster',
  posts: [34, 76],
  backRoof: { left: 3, right: 108, top: 24 },
  gable: { apexY: 8, eaveY: 58, halfWidth: 32, thickness: 8 },
  windows: [
    { left: 14, top: 67 },
    { left: 86, top: 67 },
  ],
  windowSize: 12,
  chimney: { left: 92, top: 8 },
  lantern: { x: 68, y: 70 },
};

/** Where smoke leaves the studio's chimney (sprite pixels from the top-left). */
export const STUDIO_CHIMNEY_TOP = chimneyTop(STUDIO_SPEC);

/** A skylight in the back roof, left of the gable. */
function skylight(c: PixelCanvas): void {
  const left = 14;
  const top = 32;
  fillRect(c, left - 2, top - 2, 18, 12, PALETTE.teal.outline);
  fillRect(c, left - 1, top - 1, 16, 10, PALETTE.cottage.frame);
  fillRect(c, left, top, 14, 8, PALETTE.cabin.glass);
  fillRect(c, left + 7, top, 1, 8, PALETTE.cottage.frame);
  setPixel(c, left + 1, top + 1, PALETTE.cabin.shine);
  setPixel(c, left + 2, top + 1, PALETTE.cabin.shine);
}

/** A wooden board with "</>" hanging over the door. */
function sign(c: PixelCanvas): void {
  const left = 44;
  const top = 61;
  const width = 24;
  const height = 9;
  fillRect(c, left, top, width, height, O);
  fillRect(c, left + 1, top + 1, width - 2, height - 2, PALETTE.heartwood.base);
  fillRect(c, left + 1, top + 1, width - 2, 1, PALETTE.heartwood.light);
  const ink = PALETTE.teal.outline;
  const glyph: readonly (readonly [number, number])[] = [
    // "<"
    [7, 2],
    [6, 3],
    [5, 4],
    [6, 5],
    [7, 6],
    // "/"
    [13, 1],
    [12, 2],
    [12, 3],
    [11, 4],
    [11, 5],
    [10, 6],
    // ">"
    [16, 2],
    [17, 3],
    [18, 4],
    [17, 5],
    [16, 6],
  ];
  for (const [x, y] of glyph) setPixel(c, left + x, top + y, ink);
}

export function paintStudioSprites(): SpriteSource[] {
  return [
    {
      key: 'studio',
      frames: [
        paintCottage(STUDIO_SPEC, (c) => {
          skylight(c);
          atticWindow(c, STUDIO_SPEC);
          sign(c);
        }),
      ],
    },
  ];
}
