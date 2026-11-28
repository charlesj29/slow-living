import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../core/config';
import { windStrength } from './breeze';

const settings = ISLAND_CONFIG.breeze;

describe('windStrength', () => {
  it('is a light breeze by day, stronger in a shower, calmer at night', () => {
    const day = windStrength(0, 0, settings);
    expect(day).toBeCloseTo(settings.base);
    expect(windStrength(1, 0, settings)).toBeGreaterThan(day);
    expect(windStrength(0, 1, settings)).toBeLessThan(day);
    expect(windStrength(0, 1, settings)).toBeCloseTo(settings.base * settings.nightCalm);
  });
});
