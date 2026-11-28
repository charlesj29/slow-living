import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../core/config';
import { SPLASH_SECONDS, type FishJump } from './fishJumps';
import { DIVE_SPLASH_SECONDS, diveAt, EMERGE_PX, leapScene } from './fishLeap';

const settings = ISLAND_CONFIG.lakeLife;
const at = (progress: number): FishJump => ({ index: 0, x: 100, y: 100, toLeft: false, progress });

describe('a leaping fish', () => {
  it('bursts out with a splash before the fish shows, and shows only clear of the water', () => {
    const start = leapScene(at(0), settings);
    expect(start.fish).toBeNull();
    expect(start.burst?.crown).toBe(0);
    const top = leapScene(at(0.5), settings);
    expect(top.fish?.pose).toBe('level');
    expect(top.fish?.lift).toBeGreaterThanOrEqual(EMERGE_PX);
  });

  it('splashes the very moment it dives back in, where it went in', () => {
    const under = diveAt(settings);
    const before = leapScene(at(under - 0.01), settings);
    const after = leapScene(at(under + 0.001), settings);
    expect(before.fish).not.toBeNull();
    expect(before.dive).toBeNull();
    expect(after.fish).toBeNull();
    expect(after.dive?.crown).toBe(0);
    expect(after.dive?.x).toBeCloseTo(before.fish?.x ?? 0, 0);
  });

  it('has time for the whole dive splash before the next leap', () => {
    const left = (1 - diveAt(settings)) * settings.fishJumpSeconds + SPLASH_SECONDS;
    expect(left).toBeGreaterThanOrEqual(DIVE_SPLASH_SECONDS);
  });
});
