import islandMap from '../../data/island.map.json';
import { parseMapFile } from './parseMapFile';
import type { World } from './world';

/**
 * The island everyone visits: loaded from the baked, committed map file so
 * the layout is identical on every visit and never shifts when generation
 * code changes. Re-bake with `npm run bake:island`.
 */
export function loadBakedIsland(): World {
  // The JSON's inferred type is irrelevant; the parser checks everything.
  const data: unknown = islandMap;
  return parseMapFile(data);
}
