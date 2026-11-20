import { describe, expect, it } from 'vitest';
import { getPixel } from '@/shared/render/pixelCanvas';
import { DIRECTIONS } from '../core/entities/player';
import { PLAYER_FRAME_COUNT, PLAYER_FRAMES } from '../core/systems/animation';
import { paintPixelMap, paintPlayerSprites, playerSpriteKey } from './paintPlayer';
import { PLAYER_PIXEL_MAPS } from './playerFrames';
import { PLAYER_HEIGHT, PLAYER_PALETTE, PLAYER_WIDTH } from './playerPixels';

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

  it('blinks (front and side) and breathes by sinking the upper body one pixel', () => {
    for (const direction of ['down', 'right'] as const) {
      const strip = PLAYER_PIXEL_MAPS[direction];
      expect(strip[PLAYER_FRAMES.blink], direction).not.toEqual(strip[PLAYER_FRAMES.stand]);
    }
    const [stand = [], breath = []] = PLAYER_PIXEL_MAPS.down;
    // Head and torso move down one row; the feet stay on the ground.
    expect(breath.slice(1, 19)).toEqual(stand.slice(0, 18));
    expect(breath.at(-1)).toEqual(stand.at(-1));
  });

  it('keeps every walk and run frame the same size, feet near the ground', () => {
    for (const direction of DIRECTIONS) {
      const strip = PLAYER_PIXEL_MAPS[direction];
      for (let i = PLAYER_FRAMES.walkStart; i < PLAYER_FRAME_COUNT; i++) {
        const rows = strip[i] ?? [];
        expect(rows, `${direction} ${String(i)}`).toHaveLength(PLAYER_HEIGHT);
        // Bottom two rows hold a foot (or its outline) in every frame.
        expect(
          rows.slice(-2).some((row) => row.includes('o')),
          `${direction} ${String(i)}`,
        ).toBe(true);
      }
    }
  });

  it('rejects malformed maps', () => {
    expect(() => paintPixelMap(['....'], PLAYER_PALETTE)).toThrow(/rows/);
    const bad = Array.from({ length: PLAYER_HEIGHT }, () => '?'.repeat(PLAYER_WIDTH));
    expect(() => paintPixelMap(bad, PLAYER_PALETTE)).toThrow(/Unknown pixel/);
  });
});
