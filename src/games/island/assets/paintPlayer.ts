import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { PLAYER_PIXEL_MAPS } from './playerFrames';
import { PLAYER_HEIGHT, PLAYER_PALETTE, PLAYER_WIDTH } from './playerPixels';

/** Atlas key of the player's animation strip for a direction (frames in `PLAYER_FRAMES` order). */
export function playerSpriteKey(direction: keyof typeof PLAYER_PIXEL_MAPS): string {
  return `player_${direction}`;
}

/** Turns a character-per-pixel map into a canvas. Throws on unknown characters or wrong sizes. */
export function paintPixelMap(
  rows: readonly string[],
  palette: Readonly<Record<string, string>>,
): PixelCanvas {
  if (rows.length !== PLAYER_HEIGHT)
    throw new Error(`Pixel map needs ${String(PLAYER_HEIGHT)} rows`);
  const canvas = createPixelCanvas(PLAYER_WIDTH, PLAYER_HEIGHT);
  rows.forEach((row, y) => {
    if (row.length !== PLAYER_WIDTH)
      throw new Error(`Row ${String(y)} must be ${String(PLAYER_WIDTH)} pixels`);
    [...row].forEach((char, x) => {
      if (char === '.') return;
      const hex = palette[char];
      if (!hex) throw new Error(`Unknown pixel "${char}" at (${String(x)}, ${String(y)})`);
      setPixel(canvas, x, y, hexToRgba(hex));
    });
  });
  return canvas;
}

type Facing = keyof typeof PLAYER_PIXEL_MAPS;
const FACINGS = Object.keys(PLAYER_PIXEL_MAPS) as Facing[];

/** Atlas key of a villager's animation strip (same frames as the player, other clothes). */
export function villagerSpriteKey(look: number, direction: Facing): string {
  return `villager_${String(look)}_${direction}`;
}

/**
 * Villager outfits: palette swaps of the explorer's body (cap or hat, hair,
 * skin, jacket, shirt, satchel, trousers), so they animate just as smoothly.
 */
export const VILLAGER_PALETTES: readonly Readonly<Record<string, string>>[] = [
  // Green cap, blue jacket, brown trousers.
  {
    L: '#a8dc84',
    C: '#5aa448',
    c: '#367a2c',
    v: '#3c8030',
    y: '#f4f0d0',
    h: '#7a4a24',
    H: '#4e2c14',
    J: '#6a9ae0',
    j: '#3e66b0',
    b: '#5c4030',
    B: '#3e2a1e',
    p: '#6a4a2c',
    P: '#4a321c',
  },
  // Red cap, black hair, purple jacket, grey trousers.
  {
    L: '#f8a0a0',
    C: '#d84848',
    c: '#a02c2c',
    v: '#ac3434',
    y: '#f8e070',
    h: '#3a2c26',
    H: '#221814',
    s: '#fcd8b8',
    S: '#e0a888',
    J: '#a87ad8',
    j: '#7650a8',
    b: '#d8c8a0',
    B: '#a8946c',
    p: '#4c4c5a',
    P: '#34343e',
  },
  // Straw hat, ginger hair, teal jacket, olive trousers.
  {
    L: '#f8eab8',
    C: '#dcc074',
    c: '#ac8e44',
    v: '#bc9a50',
    y: '#c84848',
    h: '#c0662e',
    H: '#8c4422',
    s: '#dca478',
    S: '#b47c50',
    J: '#4cbca4',
    j: '#2c8c7a',
    b: '#8a5a30',
    B: '#5c3a1c',
    p: '#5e6e36',
    P: '#424e26',
  },
];

function strip(
  key: string,
  direction: Facing,
  palette: Readonly<Record<string, string>>,
): SpriteSource {
  return { key, frames: PLAYER_PIXEL_MAPS[direction].map((rows) => paintPixelMap(rows, palette)) };
}

export function paintPlayerSprites(): SpriteSource[] {
  const player = FACINGS.map((direction) =>
    strip(playerSpriteKey(direction), direction, PLAYER_PALETTE),
  );
  const villagers = VILLAGER_PALETTES.flatMap((outfit, look) =>
    FACINGS.map((direction) =>
      strip(villagerSpriteKey(look, direction), direction, { ...PLAYER_PALETTE, ...outfit }),
    ),
  );
  return [...player, ...villagers];
}
