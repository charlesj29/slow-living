import {
  CARDINAL_DIRECTIONS,
  isInBounds,
  toIndex,
  toPoint,
  type TilePoint,
} from '@/shared/engine/grid';
import { isLakeTile, TileId } from '../../world/tiles';
import { getDoorFrontTile } from '../../world/world';
import type { GenerationContext, GenerationStep } from '../context';

interface DockSite {
  readonly root: TilePoint;
  readonly direction: TilePoint;
  readonly score: number;
}

function isLakeAt(context: GenerationContext, x: number, y: number): boolean {
  return (
    isInBounds(context.size, x, y) && isLakeTile(context.terrain[toIndex(context.size, x, y)] ?? 0)
  );
}

/**
 * A dock fits when every plank, the water on both sides of it and the water
 * just past its end are lake, so it sticks out into open water and the lake
 * stays one connected body around it.
 */
function fitsDock(
  context: GenerationContext,
  root: TilePoint,
  direction: TilePoint,
  length: number,
): boolean {
  const side = { x: direction.y, y: direction.x };
  for (let step = 1; step <= length + 1; step++) {
    const x = root.x + direction.x * step;
    const y = root.y + direction.y * step;
    if (!isLakeAt(context, x, y)) return false;
    if (step <= length) {
      if (!isLakeAt(context, x + side.x, y + side.y)) return false;
      if (!isLakeAt(context, x - side.x, y - side.y)) return false;
    }
  }
  return true;
}

/** Finds the dock site whose shore end is closest to the cabin door. */
function findDockSite(context: GenerationContext): DockSite | null {
  if (!context.cabin) return null;
  const door = getDoorFrontTile(context.cabin);
  const length = context.config.dock.lengthTiles;
  let best: DockSite | null = null;
  context.terrain.forEach((id, index) => {
    if (id !== TileId.Sand) return;
    const root = toPoint(context.size, index);
    for (const direction of CARDINAL_DIRECTIONS) {
      if (!fitsDock(context, root, direction, length)) continue;
      const score = Math.abs(root.x - door.x) + Math.abs(root.y - door.y);
      if (!best || score < best.score) best = { root, direction, score };
    }
  });
  return best;
}

/** Builds a wooden dock from the lake shore into the water, on the side facing the cabin. */
export const placeDock: GenerationStep = (context) => {
  const site = findDockSite(context);
  if (!site) {
    return context;
  }
  const terrain = context.terrain.slice();
  for (let step = 1; step <= context.config.dock.lengthTiles; step++) {
    const x = site.root.x + site.direction.x * step;
    const y = site.root.y + site.direction.y * step;
    terrain[toIndex(context.size, x, y)] = TileId.Dock;
  }
  return { ...context, terrain, dockRoot: site.root };
};
