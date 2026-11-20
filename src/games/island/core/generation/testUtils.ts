// Helpers shared by generation tests (not imported by production code).
import { ISLAND_CONFIG } from '../config';
import type { World } from '../world/world';
import type { GenerationContext } from './context';
import { generateWorld } from './generateWorld';
import { runGenerationPipeline } from './pipeline';

export function generateValidWorld(seed: number): World {
  const result = generateWorld(seed, ISLAND_CONFIG);
  if (!result.ok) {
    throw new Error(`Seed ${String(seed)} failed: ${result.issues.map((i) => i.code).join(', ')}`);
  }
  return result.world;
}

/** The full pipeline context of an attempt known to pass validation. */
export function validContext(seed: number): GenerationContext {
  return runGenerationPipeline(generateValidWorld(seed).generationSeed, ISLAND_CONFIG);
}
