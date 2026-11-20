import { createFractalNoise2D } from '@/shared/engine/noise';
import { createStepRng, type GenerationStep } from '../context';

/**
 * Builds a 0..1 elevation map: fractal noise blended with a radial gradient.
 * The gradient makes land likely near the centre and impossible at the edges;
 * the noise bends the coastline so it never looks like a circle.
 */
export const shapeIsland: GenerationStep = (context) => {
  const { size, config } = context;
  const { noise: noiseOptions, radialWeight } = config.island;
  const noise = createFractalNoise2D(createStepRng(context, 'shapeIsland').next, noiseOptions);

  const centerX = (size.width - 1) / 2;
  const centerY = (size.height - 1) / 2;
  const radius = Math.min(centerX, centerY);
  const elevation = new Float32Array(size.width * size.height);

  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const dx = (x - centerX) / radius;
      const dy = (y - centerY) / radius;
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
      const radialGradient = 1 - distanceFromCenter;
      elevation[y * size.width + x] =
        noise(x, y) * (1 - radialWeight) + radialGradient * radialWeight;
    }
  }

  return { ...context, elevation };
};
