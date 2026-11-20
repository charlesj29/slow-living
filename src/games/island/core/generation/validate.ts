import {
  EIGHT_DIRECTIONS,
  floodFill,
  forEachNeighbor,
  isInBounds,
  isOnBorder,
  labelRegions,
  toIndex,
  type GridSize,
  type TilePoint,
} from '@/shared/engine/grid';
import type { IslandConfig } from '../config';
import { computeBlockedMask } from '../world/collision';
import { OBJECT_REGISTRY } from '../world/objects';
import { isLakeTile, isLandTile, isSeaTile, isWalkableTile, TileId } from '../world/tiles';
import { getDoorFrontTile, type WorldObject } from '../world/world';
import type { GenerationContext } from './context';

export type ValidationIssueCode =
  | 'border-not-deep-sea'
  | 'land-share-out-of-range'
  | 'lake-count'
  | 'lake-touches-sea'
  | 'dock-missing'
  | 'cabin-missing'
  | 'cabin-not-on-land'
  | 'spawn-missing'
  | 'door-unreachable'
  | 'trail-unreachable'
  | 'reachable-area-too-small';

export interface ValidationIssue {
  readonly code: ValidationIssueCode;
  readonly message: string;
}

/** What validation needs: satisfied by a generation context and by a loaded map. */
export interface MapSnapshot {
  readonly size: GridSize;
  readonly terrain: Uint8Array;
  readonly objects: readonly WorldObject[];
  readonly cabin: WorldObject | null;
  readonly spawn: TilePoint | null;
}

type ValidationRules = IslandConfig['validation'];
type Check = (map: MapSnapshot, rules: ValidationRules) => ValidationIssue | null;

const issue = (code: ValidationIssueCode, message: string): ValidationIssue => ({ code, message });
const countWhere = (terrain: Uint8Array, predicate: (id: number) => boolean): number =>
  terrain.reduce((count, id) => count + (predicate(id) ? 1 : 0), 0);

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

const checkLandShare: Check = ({ terrain }, rules) => {
  const share = countWhere(terrain, isLandTile) / terrain.length;
  return share < rules.minLandShare || share > rules.maxLandShare
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

const checkDock: Check = ({ terrain }) =>
  terrain.includes(TileId.Dock) ? null : issue('dock-missing', 'The lake has no dock');

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

/** BFS from the spawn: door, every trail and dock plank reachable; player not boxed in. */
const checkReachability: Check = ({ size, terrain, objects, cabin, spawn }, rules) => {
  if (!spawn || !cabin) {
    return issue('spawn-missing', 'No walkable spawn tile in front of the door');
  }
  const blocked = computeBlockedMask(size, terrain, objects);
  const reached = floodFill(size, [toIndex(size, spawn.x, spawn.y)], (i) => blocked[i] === 0);

  const door = getDoorFrontTile(cabin);
  if (reached[toIndex(size, door.x, door.y)] !== 1) {
    return issue('door-unreachable', 'The cabin door cannot be reached from the spawn');
  }
  const strandedTrail = terrain.findIndex(
    (id, i) => (id === TileId.Path || id === TileId.Dock) && reached[i] !== 1,
  );
  if (strandedTrail !== -1) {
    return issue('trail-unreachable', 'Part of a trail or the dock cannot be reached');
  }
  const share =
    reached.reduce((sum, v) => sum + v, 0) / Math.max(1, countWhere(terrain, isWalkableTile));
  return share < rules.minReachableShare
    ? issue('reachable-area-too-small', `Only ${(share * 100).toFixed(1)}% of land is reachable`)
    : null;
};

const CHECKS: readonly Check[] = [
  checkBorders,
  checkLandShare,
  checkLakeCount,
  checkLakeIsolatedFromSea,
  checkDock,
  checkCabin,
  checkReachability,
];

/** Returns every invariant the map breaks; empty means valid. */
export function validateMap(map: MapSnapshot, rules: ValidationRules): ValidationIssue[] {
  return CHECKS.map((check) => check(map, rules)).filter((found) => found !== null);
}

export function validateGeneration(context: GenerationContext): ValidationIssue[] {
  return validateMap(context, context.config.validation);
}
