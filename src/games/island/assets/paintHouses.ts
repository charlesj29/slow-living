// The three village houses in the cottage style (80×80 over a 5×3 footprint;
// the roof rises two tiles above it): a front gable over the door, shuttered
// windows with flower boxes, a lantern by the door and a chimney. Each keeps
// its own character: stone walls under blue slate, logs under a mossy roof,
// white plaster and timber under straw thatch.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import { atticWindow, chimneyTop, paintCottage, type CottageSpec } from './cottageStyle';
import { PALETTE } from './palette';

const HOUSE: Omit<CottageSpec, 'roof' | 'thatched' | 'walls' | 'chimney'> = {
  width: 80,
  height: 80,
  doorCenterX: 40, // the middle of the 5-tile footprint, matching the registry's door
  wallTop: 50,
  wallBottom: 74,
  posts: [26, 52],
  backRoof: { left: 3, right: 76, top: 22 },
  gable: { apexY: 6, eaveY: 48, halfWidth: 24, thickness: 7 },
  windows: [
    { left: 12, top: 55 },
    { left: 60, top: 55 },
  ],
  windowSize: 10,
  lantern: { x: 49, y: 56 },
};

export const HOUSE_SPECS: Readonly<Record<string, CottageSpec>> = {
  house_stone: {
    ...HOUSE,
    roof: PALETTE.slate,
    thatched: false,
    walls: 'stone',
    chimney: { left: 60, top: 10 },
  },
  house_log: {
    ...HOUSE,
    roof: PALETTE.moss,
    thatched: false,
    walls: 'log',
    chimney: { left: 12, top: 12 },
  },
  house_thatch: {
    ...HOUSE,
    roof: PALETTE.thatch,
    thatched: true,
    walls: 'plaster',
    chimney: { left: 58, top: 12 },
  },
};

/** Where smoke leaves each house's chimney (sprite pixels from the top-left). */
export const HOUSE_CHIMNEY_TOPS: Readonly<Record<string, { x: number; y: number }>> =
  Object.fromEntries(
    Object.entries(HOUSE_SPECS).flatMap(([key, spec]) => {
      const top = chimneyTop(spec);
      return top ? [[key, top]] : [];
    }),
  );

export function paintHouseSprites(): SpriteSource[] {
  return Object.entries(HOUSE_SPECS).map(([key, spec]) => ({
    key,
    frames: [paintCottage(spec, (c) => atticWindow(c, spec))],
  }));
}
