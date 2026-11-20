import { describe, expect, it } from 'vitest';
import { approach, clamp } from './math';

describe('clamp', () => {
  it('returns the value when inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to the bounds', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it('throws when min is greater than max', () => {
    expect(() => clamp(1, 10, 0)).toThrow(RangeError);
  });
});

describe('approach', () => {
  it('moves towards the target without overshooting', () => {
    const next = approach(0, 10, 8, 1 / 60);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(10);
  });

  it('is frame-rate independent', () => {
    let at60 = 0;
    for (let i = 0; i < 60; i++) at60 = approach(at60, 10, 8, 1 / 60);
    let at120 = 0;
    for (let i = 0; i < 120; i++) at120 = approach(at120, 10, 8, 1 / 120);
    expect(at120).toBeCloseTo(at60, 6);
  });
});
