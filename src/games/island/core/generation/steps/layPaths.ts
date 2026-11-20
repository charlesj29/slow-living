import {
  CARDINAL_DIRECTIONS,
  forEachNeighbor,
  toIndex,
  toPoint,
  type TilePoint,
} from '@/shared/engine/grid';
import { createFractalNoise2D } from '@/shared/engine/noise';
import { findPath } from '@/shared/engine/pathfinding';
import { isSeaTile, TileId } from '../../world/tiles';
import { getDoorFrontTile, NO_OBJECT } from '../../world/world';
import { createStepRng, type GenerationContext, type GenerationStep } from '../context';

/** Sand tiles touching the sea: where beach trails can end. */
function findBeachTiles(context: GenerationContext): number[] {
  const { size, terrain } = context;
  const beach: number[] = [];
  terrain.forEach((id, index) => {
    if (id !== TileId.Sand) return;
    let touchesSea = false;
    forEachNeighbor(size, index, CARDINAL_DIRECTIONS, (n) => {
      touchesSea ||= isSeaTile(terrain[n] ?? 0);
    });
    if (touchesSea) beach.push(index);
  });
  return beach;
}

/**
 * Beach destinations spread around the island: the first is the beach closest
 * to the cabin; each next one is the beach farthest from all chosen so far.
 */
function chooseBeachTargets(
  beach: readonly number[],
  from: TilePoint,
  count: number,
  width: number,
): number[] {
  const distance = (a: number, b: TilePoint): number =>
    Math.hypot((a % width) - b.x, Math.floor(a / width) - b.y);
  const targets: number[] = [];
  const anchors: TilePoint[] = [from];
  for (let i = 0; i < count && beach.length > 0; i++) {
    const pickFarthest = i > 0;
    let best = beach[0] ?? 0;
    let bestScore = pickFarthest ? -Infinity : Infinity;
    for (const tile of beach) {
      const score = Math.min(...anchors.map((anchor) => distance(tile, anchor)));
      if (pickFarthest ? score > bestScore : score < bestScore) {
        best = tile;
        bestScore = score;
      }
    }
    targets.push(best);
    anchors.push({ x: best % width, y: Math.floor(best / width) });
  }
  return targets;
}

/**
 * Lays winding dirt trails from the cabin door to the dock and to beaches.
 * A* with noise-perturbed costs makes them meander; cheap existing trail tiles
 * make later trails merge into earlier ones. Only grass turns into path, so
 * trails fade naturally into the beach and the lake shore.
 */
export const layPaths: GenerationStep = (context) => {
  const { size, config, cabin, occupancy } = context;
  if (!cabin) return context;
  const settings = config.paths;
  const meander = createFractalNoise2D(
    createStepRng(context, 'layPaths').next,
    settings.meanderNoise,
  );
  const terrain = context.terrain.slice();

  const stepCost = (index: number): number => {
    if (occupancy[index] !== NO_OBJECT) return Infinity; // the cabin
    const id = terrain[index];
    if (id === TileId.Path || id === TileId.Dock) return settings.existingPathCost;
    const { x, y } = toPoint(size, index);
    const wiggle = meander(x, y) * settings.meanderStrength;
    if (id === TileId.Grass) return settings.grassCost + wiggle;
    if (id === TileId.Sand) return settings.sandCost + wiggle;
    return Infinity;
  };

  const door = getDoorFrontTile(cabin);
  const start = toIndex(size, door.x, door.y);
  const goals: number[] = [];
  if (context.dockRoot) goals.push(toIndex(size, context.dockRoot.x, context.dockRoot.y));
  goals.push(
    ...chooseBeachTargets(findBeachTiles(context), door, settings.beachTrails, size.width),
  );

  // Reserve every trail tile (sandy stretches too) so rocks and trees never block a trail.
  const reserved = context.reserved.slice();
  for (const goal of goals) {
    const route = findPath(size, start, goal, stepCost, settings.existingPathCost) ?? [];
    for (const index of route) {
      if (terrain[index] === TileId.Grass) terrain[index] = TileId.Path;
      reserved[index] = 1;
    }
  }
  return { ...context, terrain, reserved };
};
