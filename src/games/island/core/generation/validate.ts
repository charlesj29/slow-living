import {
  EIGHT_DIRECTIONS,
  floodFill,
  forEachNeighbor,
  isInBounds,
  isOnBorder,
  labelRegions,
  toIndex,
} from '@/shared/engine/grid';
import { computeBlockedMask } from '../world/collision';
import { OBJECT_REGISTRY } from '../world/objects';
import { isLakeTile, isLandTile, isSeaTile, isWalkableTile, TileId } from '../world/tiles';
import { getDoorFrontTile } from '../world/world';
import type { GenerationContext } from './context';

export type ValidationIssueCode =
  | 'border-not-deep-sea'
  | 'land-share-out-of-range'
  | 'lake-count'
  | 'lake-touches-sea'
  | 'cabin-missing'
  | 'cabin-not-on-land'
  | 'spawn-missing'
  | 'door-unreachable'
  | 'reachable-area-too-small';

export interface ValidationIssue {
  readonly code: ValidationIssueCode;
  readonly message: string;
}

type Check = (context: GenerationContext) => ValidationIssue | null;

const issue = (code: ValidationIssueCode, message: string): ValidationIssue => ({ code, message });

const checkBorders: Check = ({ size, terrain }) => {
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (isOnBorder(size, x, y) && terrain[toIndex(size, x, y)] !== TileId.DeepSea) {
        return issue(
          'border-not-deep-sea',
          `Border tile (${String(x)}, ${String(y)}) is not deep sea`,
        );
      }
    }
  }
  return null;
};

const checkLandShare: Check = ({ terrain, config }) => {
  const landTiles = terrain.reduce((count, id) => count + (isLandTile(id) ? 1 : 0), 0);
  const share = landTiles / terrain.length;
  const { minLandShare, maxLandShare } = config.validation;
  return share < minLandShare || share > maxLandShare
    ? issue('land-share-out-of-range', `Land covers ${(share * 100).toFixed(1)}% of the map`)
    : null;
};

const checkLakeCount: Check = ({ size, terrain }) => {
  const { regionSizes } = labelRegions(size, (i) => isLakeTile(terrain[i] ?? 0));
  return regionSizes.length === 1
    ? null
    : issue('lake-count', `Expected exactly one lake, found ${String(regionSizes.length)}`);
};

const checkLakeIsolatedFromSea: Check = ({ size, terrain }) => {
  for (let i = 0; i < terrain.length; i++) {
    if (!isLakeTile(terrain[i] ?? 0)) continue;
    let touchesSea = false;
    forEachNeighbor(size, i, EIGHT_DIRECTIONS, (n) => {
      touchesSea ||= isSeaTile(terrain[n] ?? 0);
    });
    if (touchesSea) return issue('lake-touches-sea', 'The lake touches the sea');
  }
  return null;
};

const checkCabin: Check = ({ size, terrain, cabin }) => {
  if (!cabin) return issue('cabin-missing', 'No suitable spot for the cabin was found');
  const { footprint } = OBJECT_REGISTRY[cabin.kind];
  for (let dy = 0; dy < footprint.height; dy++) {
    for (let dx = 0; dx < footprint.width; dx++) {
      const x = cabin.x + dx;
      const y = cabin.y + dy;
      if (!isInBounds(size, x, y) || !isLandTile(terrain[toIndex(size, x, y)] ?? 0)) {
        return issue('cabin-not-on-land', 'The cabin is not fully on land');
      }
    }
  }
  return null;
};

/** BFS from the spawn: the door must be reachable and the player must not be boxed in. */
const checkReachability: Check = ({ size, terrain, objects, cabin, spawn, config }) => {
  if (!spawn || !cabin)
    return issue('spawn-missing', 'No walkable spawn tile in front of the door');
  const blocked = computeBlockedMask(size, terrain, objects);
  const reached = floodFill(size, [toIndex(size, spawn.x, spawn.y)], (i) => blocked[i] === 0);

  const door = getDoorFrontTile(cabin);
  if (reached[toIndex(size, door.x, door.y)] !== 1) {
    return issue('door-unreachable', 'The cabin door cannot be reached from the spawn');
  }

  const walkableLand = terrain.reduce((count, id) => count + (isWalkableTile(id) ? 1 : 0), 0);
  const reachedCount = reached.reduce((count, value) => count + value, 0);
  const share = reachedCount / Math.max(1, walkableLand);
  return share < config.validation.minReachableShare
    ? issue('reachable-area-too-small', `Only ${(share * 100).toFixed(1)}% of land is reachable`)
    : null;
};

const CHECKS: readonly Check[] = [
  checkBorders,
  checkLandShare,
  checkLakeCount,
  checkLakeIsolatedFromSea,
  checkCabin,
  checkReachability,
];

/** Returns every invariant the generated map breaks; empty means valid. */
export function validateGeneration(context: GenerationContext): ValidationIssue[] {
  return CHECKS.map((check) => check(context)).filter((found) => found !== null);
}
