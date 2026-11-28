import { describe, expect, it } from 'vitest';
import { steerDirection } from './steer';

const STOP = 6;
const at = { x: 100, y: 100 };

describe('steering with a held finger', () => {
  it('walks towards the finger the way that gets there most', () => {
    expect(steerDirection(at, { x: 150, y: 110 }, null, STOP)).toBe('right');
    expect(steerDirection(at, { x: 90, y: 30 }, null, STOP)).toBe('up');
  });

  it('stops close to the finger', () => {
    expect(steerDirection(at, { x: 103, y: 102 }, 'right', STOP)).toBeNull();
  });

  it('keeps going one way until lined up, so a diagonal is a clean L (no zig-zag)', () => {
    // Heading right towards a point down and to the right: carries on right...
    expect(steerDirection(at, { x: 140, y: 160 }, 'right', STOP)).toBe('right');
    // ...until lined up with it, then turns down.
    expect(steerDirection({ x: 139, y: 100 }, { x: 140, y: 160 }, 'right', STOP)).toBe('down');
    // And going down, it does not flick back sideways for a pixel or two.
    expect(steerDirection({ x: 139, y: 130 }, { x: 140, y: 160 }, 'down', STOP)).toBe('down');
  });
});
