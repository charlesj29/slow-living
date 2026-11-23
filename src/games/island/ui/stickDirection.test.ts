import { describe, expect, it } from 'vitest';
import { stickDirection } from './stickDirection';

describe('stickDirection', () => {
  it('points the way of the bigger offset (no diagonals)', () => {
    expect(stickDirection(0, -40, 60, 0.25)).toBe('up');
    expect(stickDirection(0, 40, 60, 0.25)).toBe('down');
    expect(stickDirection(-40, 10, 60, 0.25)).toBe('left');
    expect(stickDirection(40, -30, 60, 0.25)).toBe('right');
    expect(stickDirection(20, 35, 60, 0.25)).toBe('down');
  });

  it('points nowhere while the thumb rests near the middle', () => {
    expect(stickDirection(5, 5, 60, 0.25)).toBeNull();
    expect(stickDirection(0, 0, 60, 0.25)).toBeNull();
  });
});
