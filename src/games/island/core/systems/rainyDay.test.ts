import { describe, expect, it } from 'vitest';
import { ISLAND_CONFIG } from '../config';
import { createVillager } from '../entities/villager';
import { carriesUmbrella, rainyActivity } from './rainyDay';

describe('a rainy day in the village', () => {
  it('sends the keeper home, the baker under the awning, and lets the night owl carry on', () => {
    expect(rainyActivity('keeper', 'sweep', true)).toBe('home');
    expect(rainyActivity('baker', 'wander', true)).toBe('shelter');
    expect(rainyActivity('baker', 'wander', false)).toBe('home');
    expect(rainyActivity('owl', 'fish', true)).toBe('fish');
    expect(rainyActivity('owl', 'home', true)).toBe('home');
  });

  it('gives an umbrella to whoever stays out in the rain', () => {
    const v = createVillager(0, 1, { x: 3, y: 3 }, [], ISLAND_CONFIG.map.tileSizePx, 'owl');
    v.activity = 'fish';
    expect(carriesUmbrella(v, true)).toBe(true);
    expect(carriesUmbrella(v, false)).toBe(false);
    v.activity = 'shelter';
    expect(carriesUmbrella(v, true)).toBe(false);
  });
});
