// Night-time window lights: for a building sprite, a same-sized overlay that
// has a warm glow exactly where the sprite has window glass. Drawn on top at
// night without the night tint, so windows look lit from inside.
import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  getPixel,
  hexToRgba,
  setPixel,
  type PixelCanvas,
  type Rgba,
} from '@/shared/render/pixelCanvas';
import { PALETTE } from './palette';

const GLOW = hexToRgba('#ffc861');
const FIRE = [PALETTE.fire.deep, PALETTE.fire.mid, PALETTE.fire.bright];
const GLOW_BRIGHT = hexToRgba('#fff0c2');

const sameColor = (a: Rgba, b: Rgba): boolean =>
  a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

/** Glass becomes warm light (glints and lamp shades brightest); flames keep their colours. */
function lightsFor(building: PixelCanvas): PixelCanvas {
  const lights = createPixelCanvas(building.width, building.height);
  for (let y = 0; y < building.height; y++) {
    for (let x = 0; x < building.width; x++) {
      const pixel = getPixel(building, x, y);
      if (sameColor(pixel, PALETTE.cabin.glass)) setPixel(lights, x, y, GLOW);
      else if (sameColor(pixel, PALETTE.cabin.shine)) setPixel(lights, x, y, GLOW_BRIGHT);
      else if (sameColor(pixel, PALETTE.lampShade)) setPixel(lights, x, y, GLOW_BRIGHT);
      // Flames are their own light: shown untinted at night, as painted.
      else if (FIRE.some((color) => sameColor(pixel, color))) setPixel(lights, x, y, pixel);
    }
  }
  return lights;
}

/** Atlas key of a building's window-light overlay. */
export const lightsKey = (spriteKey: string): string => `${spriteKey}_lights`;

/** A `<key>_lights` overlay for each of the given building sprites. */
export function paintWindowLights(
  sources: readonly SpriteSource[],
  buildingKeys: readonly string[],
): SpriteSource[] {
  return sources
    .filter((source) => buildingKeys.includes(source.key))
    .flatMap((source) => {
      // Every frame, so animated lights (the fireplace) flicker with their sprite.
      return source.frames.length > 0
        ? [{ key: lightsKey(source.key), frames: source.frames.map(lightsFor) }]
        : [];
    });
}
