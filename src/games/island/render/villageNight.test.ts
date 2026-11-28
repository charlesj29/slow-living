import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../core/config';
import { isHouseAsleep, isStallOpen, smokePuffs } from './villageNight';

const night = ISLAND_CONFIG.villageNight;

describe('the village at night', () => {
  it('turns its windows off one house after another, and wakes at dawn', () => {
    const evening = night.lightsOutFrom - 0.01;
    expect([0, 1, 2].map((i) => isHouseAsleep(evening, i, 3, night))).toEqual([
      false,
      false,
      false,
    ]);
    const middle = (night.lightsOutFrom + night.lightsOutTo) / 2 + 0.001;
    expect([0, 1, 2].map((i) => isHouseAsleep(middle, i, 3, night))).toEqual([true, true, false]);
    expect([0, 1, 2].map((i) => isHouseAsleep(0.05, i, 3, night))).toEqual([true, true, true]);
    expect(isHouseAsleep(0.5, 0, 3, night)).toBe(false);
  });

  it('opens the market stall in the morning and closes it in the evening', () => {
    expect(isStallOpen(0.4, night)).toBe(true);
    expect(isStallOpen(0.9, night)).toBe(false);
    expect(isStallOpen(0.1, night)).toBe(false);
  });

  it('smokes most at breakfast and dinner, a wisp at night', () => {
    expect(smokePuffs(0.3, night)).toBe(3);
    expect(smokePuffs(0.75, night)).toBe(3);
    expect(smokePuffs(0.5, night)).toBe(2);
    expect(smokePuffs(0.05, night)).toBe(1);
  });
});
