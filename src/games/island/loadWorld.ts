import { ISLAND_CONFIG } from './core/config';
import { generateWorld } from './core/generation/generateWorld';
import { loadBakedIsland } from './core/world/bakedIsland';
import type { World } from './core/world/world';

export type WorldLoadResult =
  | { readonly ok: true; readonly world: World }
  | { readonly ok: false; readonly title: string; readonly details: readonly string[] };

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * The baked island normally; a freshly generated island when a dev seed is
 * given (authoring preview). Never throws: failures become a displayable result.
 */
export function loadWorld(devSeed: number | undefined): WorldLoadResult {
  if (devSeed === undefined) {
    try {
      return { ok: true, world: loadBakedIsland() };
    } catch (error) {
      return {
        ok: false,
        title: 'The island map could not be loaded',
        details: [describeError(error)],
      };
    }
  }
  const result = generateWorld(devSeed, ISLAND_CONFIG);
  if (result.ok) {
    return { ok: true, world: result.world };
  }
  return {
    ok: false,
    title: `Seed ${String(devSeed)} produced no valid island after ${String(result.attempts)} attempts`,
    details: result.issues.map((issue) => issue.message),
  };
}
