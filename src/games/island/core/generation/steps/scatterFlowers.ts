import { toIndex } from '@/shared/engine/grid';
import { createFractalNoise2D } from '@/shared/engine/noise';
import { FLOWER_KINDS, type ObjectKind } from '../../world/objects';
import { TileId } from '../../world/tiles';
import { NO_OBJECT } from '../../world/world';
import { createStepRng, type GenerationStep } from '../context';
import { addObject, copyObjectLayer } from '../objectLayer';

function flowerKindFor(colorValue: number): ObjectKind {
  const index = Math.min(FLOWER_KINDS.length - 1, Math.floor(colorValue * FLOWER_KINDS.length));
  return FLOWER_KINDS[index] ?? 'flower_red';
}

/**
 * Decorations on free meadow tiles: flower patches (noise-driven, each patch
 * leaning towards one colour), a few scattered flowers, and grass tufts.
 */
export const scatterFlowers: GenerationStep = (context) => {
  const { size, config, terrain, reserved } = context;
  const settings = config.decorations;
  const rng = createStepRng(context, 'scatterFlowers');
  const patchNoise = createFractalNoise2D(rng.next, settings.flowerPatchNoise);
  const colorNoise = createFractalNoise2D(rng.next, settings.flowerColorNoise);
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
      const isInPatch = patchNoise(x, y) > settings.flowerPatchThreshold;
      const flowerChance = isInPatch ? settings.flowerPatchDensity : settings.scatteredFlowerChance;
      if (rng.chance(flowerChance)) {
        addObject(layer, flowerKindFor(colorNoise(x, y)), x, y);
      } else if (rng.chance(settings.grassTuftChance)) {
        addObject(layer, 'grass_tuft', x, y);
      }
    }
  }

  return { ...context, objects: layer.objects, occupancy: layer.occupancy };
};
