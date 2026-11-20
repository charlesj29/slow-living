import {
  distanceField,
  EIGHT_DIRECTIONS,
  floodFill,
  toPoint,
  type TilePoint,
} from '@/shared/engine/grid';
import { createFractalNoise2D } from '@/shared/engine/noise';
import { TileId } from '../../world/tiles';
import { createStepRng, type GenerationContext, type GenerationStep } from '../context';

/** Grass tiles far enough from the coast to hold a lake of the given extent plus its shore. */
function findLakeCenters(context: GenerationContext, requiredCoastDistance: number): number[] {
  const { size, terrain } = context;
  const coastDistance = distanceField(size, (i) => terrain[i] !== TileId.Grass);
  const candidates: number[] = [];
  for (let i = 0; i < coastDistance.length; i++) {
    if ((coastDistance[i] ?? 0) >= requiredCoastDistance) {
      candidates.push(i);
    }
  }
  return candidates;
}

/**
 * Carves one fresh-water lake: a noise-bent blob, shallows along its edge and a
 * sand shore around it. It is placed far enough inland that it can never touch
 * the sea; if no such spot exists, `lakeCenter` stays null and validation fails.
 */
export const carveLake: GenerationStep = (context) => {
  const { size, config } = context;
  const settings = config.lake;
  const rng = createStepRng(context, 'carveLake');

  const radius = rng.range(settings.minRadius, settings.maxRadius);
  const maxExtent = Math.ceil(radius * (1 + settings.shapeNoiseAmount));
  const requiredCoastDistance = maxExtent + settings.shoreWidthTiles + settings.minCoastGapTiles;
  const candidates = findLakeCenters(context, requiredCoastDistance);
  if (candidates.length === 0) {
    return context;
  }

  const centerIndex = rng.pick(candidates);
  const center: TilePoint = toPoint(size, centerIndex);
  const shapeNoise = createFractalNoise2D(rng.next, settings.shapeNoise);

  const isInsideBlob = (index: number): boolean => {
    const { x, y } = toPoint(size, index);
    const distance = Math.hypot(x - center.x, y - center.y) / radius;
    const edgeOffset = (shapeNoise(x, y) * 2 - 1) * settings.shapeNoiseAmount;
    return distance < 1 + edgeOffset;
  };
  // Noise can split the blob; keep only the part connected to the centre so there is exactly one lake.
  const lakeMask = floodFill(size, [centerIndex], isInsideBlob);

  const terrain = context.terrain.slice();
  // 8-way distances so the shallows and the shore also cover diagonal neighbours.
  const distanceToLand = distanceField(size, (i) => lakeMask[i] === 0, EIGHT_DIRECTIONS);
  const distanceToLake = distanceField(size, (i) => lakeMask[i] === 1, EIGHT_DIRECTIONS);
  for (let i = 0; i < terrain.length; i++) {
    if (lakeMask[i] === 1) {
      terrain[i] =
        (distanceToLand[i] ?? 0) <= settings.shallowWidthTiles
          ? TileId.LakeShallow
          : TileId.LakeWater;
    } else if (
      terrain[i] === TileId.Grass &&
      (distanceToLake[i] ?? 0) <= settings.shoreWidthTiles
    ) {
      terrain[i] = TileId.Sand;
    }
  }

  return { ...context, terrain, lakeCenter: { x: center.x, y: center.y } };
};
