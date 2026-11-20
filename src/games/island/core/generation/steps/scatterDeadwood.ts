import { isInBounds, toIndex } from '@/shared/engine/grid';
import { OBJECT_REGISTRY } from '../../world/objects';
import { TileId } from '../../world/tiles';
import { NO_OBJECT } from '../../world/world';
import { createStepRng, type GenerationContext, type GenerationStep } from '../context';
import { addObject, copyObjectLayer, type ObjectLayer } from '../objectLayer';

/** Distinct trees with a trunk tile within `radius` tiles of (x, y). */
function treesNear(
  context: GenerationContext,
  layer: ObjectLayer,
  x: number,
  y: number,
  radius: number,
): number {
  const seen = new Set<number>();
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (!isInBounds(context.size, x + dx, y + dy)) continue;
      const id = layer.occupancy[toIndex(context.size, x + dx, y + dy)] ?? NO_OBJECT;
      const object = id === NO_OBJECT ? undefined : layer.objects[id];
      if (object && OBJECT_REGISTRY[object.kind].category === 'tree') seen.add(id);
    }
  }
  return seen.size;
}

/**
 * Woodland litter: the odd stump (blocks, like a rock) and fallen branch
 * (flat, walkable) on free grass among trees — never in open meadows, on
 * trails or around the cabin.
 */
export const scatterDeadwood: GenerationStep = (context) => {
  const { size, config, terrain, reserved } = context;
  const settings = config.deadwood;
  const rng = createStepRng(context, 'scatterDeadwood');
  const layer = copyObjectLayer(context);

  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const index = toIndex(size, x, y);
      if (
        terrain[index] !== TileId.Grass ||
        reserved[index] === 1 ||
        layer.occupancy[index] !== NO_OBJECT ||
        treesNear(context, layer, x, y, settings.searchRadiusTiles) < settings.minNearbyTrees
      ) {
        continue;
      }
      if (rng.chance(settings.stumpChance)) addObject(layer, 'stump', x, y);
      else if (rng.chance(settings.branchChance)) addObject(layer, 'branch', x, y);
    }
  }

  return { ...context, objects: layer.objects, occupancy: layer.occupancy };
};
