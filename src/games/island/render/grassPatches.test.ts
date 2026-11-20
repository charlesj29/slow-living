import { describe, expect, it } from 'vitest';
import { isGrassSprite, patchValues } from './grassPatches';

const NOISE = { scale: 0.07, octaves: 2, persistence: 0.5, lacunarity: 2 };

describe('grass patches', () => {
  it('applies only to grass tiles and grass edges', () => {
    expect(isGrassSprite('tile_grass.2')).toBe(true);
    expect(isGrassSprite('edge_grass_n.1')).toBe(true);
    expect(isGrassSprite('corner_grass_se.0')).toBe(true);
    expect(isGrassSprite('tile_sand.0')).toBe(false);
    expect(isGrassSprite('edge_sand_n.0')).toBe(false);
    expect(isGrassSprite('tile_path.1')).toBe(false);
  });

  it('is deterministic', () => {
    expect(patchValues(32, 32, NOISE)).toEqual(patchValues(32, 32, NOISE));
  });

  it('varies smoothly across the map (patches, not per-tile noise)', () => {
    const size = 64;
    const values = patchValues(size, size, NOISE);
    let totalStep = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size - 1; x++) {
        totalStep += Math.abs((values[y * size + x] ?? 0) - (values[y * size + x + 1] ?? 0));
      }
    }
    const averageStep = totalStep / (size * (size - 1));
    const range = Math.max(...values) - Math.min(...values);
    expect(range).toBeGreaterThan(100);
    expect(averageStep).toBeLessThan(range / 10);
  });
});
