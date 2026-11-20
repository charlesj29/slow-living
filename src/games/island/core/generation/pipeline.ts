import type { IslandConfig } from '../config';
import { createInitialContext, type GenerationContext, type GenerationStep } from './context';
import { assignTerrain } from './steps/assignTerrain';
import { carveLake } from './steps/carveLake';
import { chooseSpawn } from './steps/chooseSpawn';
import { placeCabin } from './steps/placeCabin';
import { scatterFlowers } from './steps/scatterFlowers';
import { scatterTrees } from './steps/scatterTrees';
import { shapeIsland } from './steps/shapeIsland';

/** Order matters: each step builds on the previous ones. Validation runs after the last step. */
export const GENERATION_STEPS: readonly GenerationStep[] = [
  shapeIsland,
  assignTerrain,
  carveLake,
  placeCabin,
  scatterTrees,
  scatterFlowers,
  chooseSpawn,
];

export function runGenerationPipeline(seed: number, config: IslandConfig): GenerationContext {
  return GENERATION_STEPS.reduce(
    (context, step) => step(context),
    createInitialContext(seed, config),
  );
}
