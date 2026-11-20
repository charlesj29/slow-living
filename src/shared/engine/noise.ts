import { createNoise2D } from 'simplex-noise';
import type { RandomFn } from './random';

export interface FractalNoiseOptions {
  /** Base frequency in cycles per tile (smaller = larger features). */
  readonly scale: number;
  readonly octaves: number;
  /** Amplitude multiplier per octave (0..1). */
  readonly persistence: number;
  /** Frequency multiplier per octave (usually 2). */
  readonly lacunarity: number;
}

/** Noise sampler returning values in [0, 1]. */
export type Noise2D = (x: number, y: number) => number;

/**
 * Seeded fractal (multi-octave) simplex noise, normalised to [0, 1].
 * Octaves add finer detail on top of large shapes, which gives natural-looking
 * coastlines and forest edges.
 */
export function createFractalNoise2D(random: RandomFn, options: FractalNoiseOptions): Noise2D {
  const simplex = createNoise2D(random);

  let amplitudeSum = 0;
  let amplitude = 1;
  for (let octave = 0; octave < options.octaves; octave++) {
    amplitudeSum += amplitude;
    amplitude *= options.persistence;
  }

  return (x, y) => {
    let total = 0;
    let octaveAmplitude = 1;
    let frequency = options.scale;
    for (let octave = 0; octave < options.octaves; octave++) {
      total += simplex(x * frequency, y * frequency) * octaveAmplitude;
      octaveAmplitude *= options.persistence;
      frequency *= options.lacunarity;
    }
    return (total / amplitudeSum + 1) / 2;
  };
}
