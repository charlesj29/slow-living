import { toIndex } from '@/shared/engine/grid';
import { createFractalNoise2D } from '@/shared/engine/noise';
import { TileId } from '../../world/tiles';
import { NO_OBJECT } from '../../world/world';
import { createStepRng, type GenerationStep } from '../context';
import { addObject, copyObjectLayer } from '../objectLayer';

const SPECIES_SPLIT = 0.5;

/**
 * Forests come from low-frequency noise (clusters with soft edges, not uniform
 * scatter); meadows get the occasional lone tree. A second noise groups oaks
 * and pines into separate stands.
 */
export const scatterTrees: GenerationStep = (context) => {
  const { size, config, terrain, reserved } = context;
  const settings = config.trees;
  const rng = createStepRng(context, 'scatterTrees');
  const forestNoise = createFractalNoise2D(rng.next, settings.forestNoise);
  const speciesNoise = createFractalNoise2D(rng.next, settings.speciesNoise);
  const layer = copyObjectLayer(context);

  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const index = toIndex(size, x, y);
      if (
        terrain[index] !== TileId.Grass ||
        reserved[index] === 1 ||
        layer.occupancy[index] !== NO_OBJECT
      ) {
        continue;
      }
      const isForest = forestNoise(x, y) > settings.forestThreshold;
      if (rng.chance(isForest ? settings.forestDensity : settings.loneTreeChance)) {
        addObject(layer, speciesNoise(x, y) > SPECIES_SPLIT ? 'tree_oak' : 'tree_pine', x, y);
      }
    }
  }

  return { ...context, objects: layer.objects, occupancy: layer.occupancy };
};
