import type { SpriteSource } from '@/shared/render/atlasLayout';
import {
  createPixelCanvas,
  hexToRgba,
  setPixel,
  type PixelCanvas,
} from '@/shared/render/pixelCanvas';
import { PLAYER_PIXEL_MAPS, type CharacterMaps } from './playerFrames';
import { VILLAGER_CHARACTERS } from './villagerParts';
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

/** Atlas key of a villager's animation strip (`look` = which of the villager characters). */
export function villagerSpriteKey(look: number, direction: Facing): string {
  return `villager_${String(look)}_${direction}`;
}

function strip(
  key: string,
  maps: CharacterMaps,
  direction: Facing,
  palette: Readonly<Record<string, string>>,
): SpriteSource {
  return { key, frames: maps[direction].map((rows) => paintPixelMap(rows, palette)) };
}

export function paintPlayerSprites(): SpriteSource[] {
  const player = FACINGS.map((direction) =>
    strip(playerSpriteKey(direction), PLAYER_PIXEL_MAPS, direction, PLAYER_PALETTE),
  );
  // The villagers are their own characters (villagerParts.ts), not recoloured explorers.
  const villagers = VILLAGER_CHARACTERS.flatMap((character, look) =>
    FACINGS.map((direction) =>
      strip(villagerSpriteKey(look, direction), character.maps, direction, character.palette),
    ),
  );
  return [...player, ...villagers];
}
