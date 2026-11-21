import { describe, expect, it } from 'vitest';
import {
  advanceTimeOfDay,
  clockLabel,
  lightingAt,
  MIDNIGHT,
  NOON,
  targetLighting,
} from './dayNight';

describe('day/night cycle', () => {
  it('advances by the step and wraps at midnight', () => {
    expect(advanceTimeOfDay(0.5, 60, 600)).toBeCloseTo(0.6);
    expect(advanceTimeOfDay(0.95, 60, 600)).toBeCloseTo(0.05);
  });

  it('is full daylight at noon and dark blue with lit windows at midnight', () => {
    expect(lightingAt(NOON)).toEqual({ tint: [1, 1, 1], lights: 0 });
    const night = lightingAt(MIDNIGHT);
    expect(night.tint[2]).toBeGreaterThan(night.tint[0]);
    expect(night.tint[0]).toBeLessThan(0.6);
    expect(night.lights).toBe(1);
  });

  it('warms up at dusk and changes smoothly (no jumps between nearby times)', () => {
    const dusk = lightingAt(0.77);
    expect(dusk.tint[0]).toBeGreaterThan(dusk.tint[2]);
    for (let t = 0; t < 1; t += 0.001) {
      const a = lightingAt(t);
      const b = lightingAt(t + 0.001);
      for (let c = 0; c < 3; c++) {
        expect(Math.abs((a.tint[c] ?? 0) - (b.tint[c] ?? 0))).toBeLessThan(0.05);
      }
    }
  });

  it('follows the clock in Auto and holds noon or midnight otherwise', () => {
    expect(targetLighting('auto', 0.77)).toEqual(lightingAt(0.77));
    expect(targetLighting('day', 0.02)).toEqual(lightingAt(NOON));
    expect(targetLighting('night', 0.5)).toEqual(lightingAt(MIDNIGHT));
  });

  it('labels the time as a 24-hour clock', () => {
    expect(clockLabel(0)).toBe('00:00');
    expect(clockLabel(0.5)).toBe('12:00');
    expect(clockLabel(0.75)).toBe('18:00');
  });
});
