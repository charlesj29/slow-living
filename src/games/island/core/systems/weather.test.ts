import { describe, expect, it } from 'vitest';
import { createRng } from '@/shared/engine/random';
import { ISLAND_CONFIG } from '../config';
import { createWeather, rainyTint, updateWeather } from './weather';

const settings = ISLAND_CONFIG.weather;
const STEP = 1 / 10;

describe('weather', () => {
  it('starts clear and stays clear for at least the shortest clear spell', () => {
    const weather = createWeather(createRng(1), settings);
    expect(weather).toMatchObject({ raining: false, intensity: 0 });
    const rng = createRng(2);
    for (let t = 0; t < settings.minClearSeconds - 1; t += STEP) {
      updateWeather(weather, rng, STEP, settings);
    }
    expect(weather.intensity).toBe(0);
  });

  it('rains now and then: showers of the configured length, easing in and out', () => {
    const rng = createRng(5);
    const weather = createWeather(rng, settings);
    const showers: number[] = [];
    let current = 0;
    let largestStep = 0;
    let previous = 0;
    for (let t = 0; t < 3600; t += STEP) {
      updateWeather(weather, rng, STEP, settings);
      largestStep = Math.max(largestStep, Math.abs(weather.intensity - previous));
      previous = weather.intensity;
      if (weather.raining) current += STEP;
      else if (current > 0) {
        showers.push(current);
        current = 0;
      }
    }
    // An hour: a few showers (one every 10–15 minutes of clear weather).
    expect(showers.length).toBeGreaterThanOrEqual(3);
    expect(showers.length).toBeLessThanOrEqual(6);
    for (const length of showers) {
      expect(length).toBeGreaterThanOrEqual(settings.minRainSeconds - STEP);
      expect(length).toBeLessThanOrEqual(settings.maxRainSeconds + STEP);
    }
    // No sudden jumps: the intensity follows over `fadeSeconds`.
    expect(largestStep).toBeLessThanOrEqual(STEP / settings.fadeSeconds + 1e-9);
  });

  it('greys the light by the shower', () => {
    expect(rainyTint([1, 1, 1], 0, settings)).toEqual([1, 1, 1]);
    expect(rainyTint([1, 1, 1], 1, settings)).toEqual([...settings.rainTint]);
  });
});
