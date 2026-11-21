import { deriveSeed } from '@/shared/engine/random';
import type { IslandConfig } from '../config';
import { computeBlockedMask } from '../world/collision';
import type { World } from '../world/world';
import type { GenerationContext } from './context';
import { runGenerationPipeline } from './pipeline';
import { validateGeneration, type ValidationIssue } from './validate';

export type GenerationResult =
  | { readonly ok: true; readonly world: World; readonly attempts: number }
  | {
      readonly ok: false;
      readonly seed: number;
      readonly attempts: number;
      /** Issues found on the last attempt. */
      readonly issues: readonly ValidationIssue[];
    };

/** Attempt 0 uses the seed itself; retries use seeds derived from it, so results stay reproducible. */
export function attemptSeed(seed: number, attempt: number): number {
  return attempt === 0 ? seed : deriveSeed(seed, `retry-${String(attempt)}`);
}

function toWorld(context: GenerationContext, requestedSeed: number): World {
  const { cabin, spawn, size } = context;
  if (!cabin || !spawn) {
    // Validation guarantees both exist; reaching this is a programming error.
    throw new Error('Cannot build a world without a cabin and a spawn point');
  }
  return {
    seed: requestedSeed,
    generationSeed: context.seed,
    width: size.width,
    height: size.height,
    terrain: context.terrain,
    objects: context.objects,
    occupancy: context.occupancy,
    blocked: computeBlockedMask(size, context.terrain, context.objects),
    cabin,
    spawn,
    village: context.village,
  };
}

/** Generates a validated island for `seed`, retrying with derived seeds up to `maxAttempts`. */
export function generateWorld(seed: number, config: IslandConfig): GenerationResult {
  let lastIssues: readonly ValidationIssue[] = [];
  for (let attempt = 0; attempt < config.generation.maxAttempts; attempt++) {
    const context = runGenerationPipeline(attemptSeed(seed, attempt), config);
    const issues = validateGeneration(context);
    if (issues.length === 0) {
      return { ok: true, world: toWorld(context, seed), attempts: attempt + 1 };
    }
    lastIssues = issues;
  }
  return { ok: false, seed, attempts: config.generation.maxAttempts, issues: lastIssues };
}
