import { toIndex } from '@/shared/engine/grid';
import { createFractalNoise2D } from '@/shared/engine/noise';
import { TileId } from '../../world/tiles';
import { NO_OBJECT } from '../../world/world';
import { createStepRng, type GenerationStep } from '../context';
import { addObject, copyObjectLayer } from '../objectLayer';

/** Rocky outcrops (noise clusters) plus the odd lone rock, on free grass and sand. */
export const scatterRocks: GenerationStep = (context) => {
  const { size, config, terrain, reserved } = context;
  const settings = config.rocks;
  const rng = createStepRng(context, 'scatterRocks');
  const clusterNoise = createFractalNoise2D(rng.next, settings.clusterNoise);
  const layer = copyObjectLayer(context);

  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const index = toIndex(size, x, y);
      const id = terrain[index];
      if (
        (id !== TileId.Grass && id !== TileId.Sand) ||
        reserved[index] === 1 ||
        layer.occupancy[index] !== NO_OBJECT
      ) {
        continue;
      }
      const inCluster = clusterNoise(x, y) > settings.clusterThreshold;
      if (rng.chance(inCluster ? settings.clusterDensity : settings.scatteredChance)) {
        addObject(layer, 'rock', x, y);
      }
    }
  }

  return { ...context, objects: layer.objects, occupancy: layer.occupancy };
};
