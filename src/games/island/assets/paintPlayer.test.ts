import { describe, expect, it } from 'vitest';
import { getPixel } from '@/shared/render/pixelCanvas';
import { DIRECTIONS } from '../core/entities/player';
import { PLAYER_FRAME_COUNT } from '../core/systems/animation';
import { paintPixelMap, paintPlayerSprites, playerSpriteKey } from './paintPlayer';
import { PLAYER_HEIGHT, PLAYER_PALETTE, PLAYER_PIXEL_MAPS, PLAYER_WIDTH } from './playerPixels';

describe('player sprites', () => {
  it('has a strip of walk frames for every direction', () => {
    const sprites = paintPlayerSprites();
    for (const direction of DIRECTIONS) {
      const sprite = sprites.find((s) => s.key === playerSpriteKey(direction));
      expect(sprite?.frames).toHaveLength(PLAYER_FRAME_COUNT);
      for (const frame of sprite?.frames ?? []) {
        expect([frame.width, frame.height]).toEqual([PLAYER_WIDTH, PLAYER_HEIGHT]);
      }
    }
  });

  it('uses only known colours in every pixel map', () => {
    for (const direction of DIRECTIONS) {
      for (const rows of PLAYER_PIXEL_MAPS[direction]) {
        expect(() => paintPixelMap(rows, PLAYER_PALETTE)).not.toThrow();
      }
    }
  });

  it('stands on the bottom row (feet line up with the hitbox)', () => {
    for (const direction of DIRECTIONS) {
      const [standing] = PLAYER_PIXEL_MAPS[direction];
      const canvas = paintPixelMap(standing ?? [], PLAYER_PALETTE);
      const bottomRowOpaque = Array.from(
        { length: PLAYER_WIDTH },
        (_, x) => getPixel(canvas, x, PLAYER_HEIGHT - 1)[3],
      );
      expect(
        bottomRowOpaque.some((alpha) => alpha > 0),
        direction,
      ).toBe(true);
    }
  });

  it('mirrors the right-facing frames for left', () => {
    const right = PLAYER_PIXEL_MAPS.right[0] ?? [];
    const left = PLAYER_PIXEL_MAPS.left[0] ?? [];
    expect(left.map((row) => [...row].reverse().join(''))).toEqual(right);
  });

  it('rejects malformed maps', () => {
    expect(() => paintPixelMap(['....'], PLAYER_PALETTE)).toThrow(/rows/);
    const bad = Array.from({ length: PLAYER_HEIGHT }, () => '?'.repeat(PLAYER_WIDTH));
    expect(() => paintPixelMap(bad, PLAYER_PALETTE)).toThrow(/Unknown pixel/);
  });
});
