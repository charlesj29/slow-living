import { ISLAND_CONFIG, type IslandConfig } from '../config';
import { formatMapFile, worldToMapFile } from '../world/mapFile';
import { generateWorld } from './generateWorld';

export const ISLAND_MAP_NAME = 'Island';

/**
 * Authoring entry point used by `npm run bake:island`: generates the island
 * for `seed` and returns the formatted map-file text. Throws if no valid
 * island could be generated, so a broken map is never written.
 */
export function bakeIslandMap(seed: number, config: IslandConfig = ISLAND_CONFIG): string {
  const result = generateWorld(seed, config);
  if (!result.ok) {
    const reasons = result.issues.map((issue) => issue.message).join('; ');
    throw new Error(
      `Seed ${String(seed)} failed after ${String(result.attempts)} attempts: ${reasons}`,
    );
  }
  return formatMapFile(worldToMapFile(result.world, ISLAND_MAP_NAME, config.map.chunkSizeTiles));
}
