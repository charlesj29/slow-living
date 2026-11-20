import { isInBounds, toIndex } from '@/shared/engine/grid';
import { OBJECT_REGISTRY } from '../../world/objects';
import { isWalkableTile } from '../../world/tiles';
import { getDoorFrontTile, NO_OBJECT } from '../../world/world';
import type { GenerationStep } from '../context';

/** The player starts on the tile right in front of the cabin door. */
export const chooseSpawn: GenerationStep = (context) => {
  if (!context.cabin) {
    return context;
  }
  const { size, terrain, occupancy, objects } = context;
  const front = getDoorFrontTile(context.cabin);
  if (!isInBounds(size, front.x, front.y)) {
    return context;
  }
  const index = toIndex(size, front.x, front.y);
  const objectId = occupancy[index] ?? NO_OBJECT;
  const object = objectId === NO_OBJECT ? undefined : objects[objectId];
  const isBlockedByObject = object !== undefined && OBJECT_REGISTRY[object.kind].blocksMovement;
  if (!isWalkableTile(terrain[index] ?? 0) || isBlockedByObject) {
    return context;
  }
  return { ...context, spawn: front };
};
