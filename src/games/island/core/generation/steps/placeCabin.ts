import { distanceField, isInBounds, toIndex, type TilePoint } from '@/shared/engine/grid';
import { OBJECT_REGISTRY } from '../../world/objects';
import { isLakeTile, isWaterTile, TileId } from '../../world/tiles';
import { createStepRng, type GenerationContext, type GenerationStep } from '../context';
import { addObject, copyObjectLayer } from '../objectLayer';

interface Area {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** Footprint plus a margin all round and extra clearance rows in front of the door (below). */
function cabinSiteArea(context: GenerationContext, x: number, y: number): Area {
  const { footprint } = OBJECT_REGISTRY.cabin;
  const { marginTiles, frontClearanceTiles } = context.config.cabin;
  return {
    left: x - marginTiles,
    top: y - marginTiles,
    right: x + footprint.width - 1 + marginTiles,
    bottom: y + footprint.height - 1 + Math.max(marginTiles, frontClearanceTiles),
  };
}

function isSiteSuitable(
  context: GenerationContext,
  area: Area,
  waterDistance: Int32Array,
): boolean {
  const { size, terrain, config } = context;
  for (let y = area.top; y <= area.bottom; y++) {
    for (let x = area.left; x <= area.right; x++) {
      if (!isInBounds(size, x, y)) return false;
      const index = toIndex(size, x, y);
      if (terrain[index] !== TileId.Grass) return false;
      if ((waterDistance[index] ?? 0) < config.cabin.minWaterDistanceTiles) return false;
    }
  }
  return true;
}

/** The candidate (top-left tile index) nearest the anchor tile. */
function closestTo(candidates: readonly number[], anchor: TilePoint, width: number): number {
  let best = candidates[0] ?? 0;
  let bestDistance = Infinity;
  for (const index of candidates) {
    const distance = Math.hypot((index % width) - anchor.x, Math.floor(index / width) - anchor.y);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Places the cabin on flat grass away from water, preferably within sight of
 * the lake. Its surroundings and the area in front of the door are reserved so
 * later steps keep them clear.
 */
export const placeCabin: GenerationStep = (context) => {
  const { size, terrain, config } = context;
  const waterDistance = distanceField(size, (i) => isWaterTile(terrain[i] ?? 0));
  const lakeDistance = distanceField(size, (i) => isLakeTile(terrain[i] ?? 0));

  const candidates: number[] = [];
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (isSiteSuitable(context, cabinSiteArea(context, x, y), waterDistance)) {
        candidates.push(toIndex(size, x, y));
      }
    }
  }
  if (candidates.length === 0) {
    return context;
  }
  const nearLake = candidates.filter((index) => {
    const distance = lakeDistance[index] ?? -1;
    return distance >= 0 && distance <= config.cabin.maxLakeDistanceTiles;
  });

  const pool = nearLake.length > 0 ? nearLake : candidates;
  const chosen = config.cabin.anchor
    ? closestTo(pool, config.cabin.anchor, size.width)
    : createStepRng(context, 'placeCabin').pick(pool);
  const cabinX = chosen % size.width;
  const cabinY = Math.floor(chosen / size.width);

  const layer = copyObjectLayer(context);
  const cabin = addObject(layer, 'cabin', cabinX, cabinY);

  const reserved = context.reserved.slice();
  const area = cabinSiteArea(context, cabinX, cabinY);
  for (let y = area.top; y <= area.bottom; y++) {
    for (let x = area.left; x <= area.right; x++) {
      reserved[toIndex(size, x, y)] = 1;
    }
  }

  return { ...context, objects: layer.objects, occupancy: layer.occupancy, reserved, cabin };
};
