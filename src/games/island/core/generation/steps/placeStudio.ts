import { isInBounds, toIndex } from '@/shared/engine/grid';
import { OBJECT_REGISTRY } from '../../world/objects';
import { TileId } from '../../world/tiles';
import { getDoorFrontTile, NO_OBJECT } from '../../world/world';
import type { GenerationContext, GenerationStep } from '../context';
import { addObject, objectLayerWithout } from '../objectLayer';
import { prefixSums, rectSum, routeToTrail } from '../siteSearch';

interface Site {
  /** The studio's top-left tile. */
  readonly x: number;
  readonly y: number;
}

/**
 * The studio plus a one-tile margin on the sides and top, and clear ground in
 * front of the door: everything the step clears and reserves.
 */
function siteArea(
  x: number,
  y: number,
  frontClearance: number,
): { left: number; top: number; right: number; bottom: number } {
  const { footprint } = OBJECT_REGISTRY.studio;
  return {
    left: x - 1,
    top: y - 1,
    right: x + footprint.width,
    bottom: y + footprint.height - 1 + frontClearance,
  };
}

/**
 * The best spot: the building on free grass, the margin and the ground in front
 * free grass or trail, close to the preferred distance from the cottage door
 * (a short walk, not squeezed against it) and clearing as few trees and rocks
 * as possible.
 */
function findSite(context: GenerationContext): Site | null {
  const { size, terrain, reserved, occupancy, config, cabin } = context;
  if (!cabin) return null;
  const rules = config.studio;
  const { footprint } = OBJECT_REGISTRY.studio;
  const free = (i: number): boolean => reserved[i] === 0;
  const grassSums = prefixSums(size, (i) => (terrain[i] === TileId.Grass && free(i) ? 1 : 0));
  const openSums = prefixSums(size, (i) =>
    (terrain[i] === TileId.Grass || terrain[i] === TileId.Path) && free(i) ? 1 : 0,
  );
  const objectSums = prefixSums(size, (i) => (occupancy[i] !== NO_OBJECT ? 1 : 0));
  const home = getDoorFrontTile(cabin);
  const radius = rules.searchRadiusTiles;
  let best: Site | null = null;
  let bestScore = Infinity;
  for (let y = home.y - radius; y <= home.y + radius; y++) {
    for (let x = home.x - radius; x <= home.x + radius; x++) {
      const area = siteArea(x, y, rules.frontClearanceTiles);
      if (!isInBounds(size, area.left, area.top) || !isInBounds(size, area.right, area.bottom)) {
        continue;
      }
      const right = x + footprint.width - 1;
      const bottom = y + footprint.height - 1;
      if (rectSum(grassSums, size, x, y, right, bottom) !== footprint.width * footprint.height) {
        continue;
      }
      const areaTiles = (area.right - area.left + 1) * (area.bottom - area.top + 1);
      if (rectSum(openSums, size, area.left, area.top, area.right, area.bottom) !== areaTiles) {
        continue;
      }
      const distance = Math.hypot(x + footprint.width / 2 - home.x, y + footprint.height - home.y);
      if (distance < rules.minDistanceTiles) continue;
      const cleared = rectSum(objectSums, size, area.left, area.top, area.right, area.bottom);
      const score =
        Math.abs(distance - rules.preferredDistanceTiles) + cleared * rules.clearedObjectCost;
      if (score < bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }
  }
  return best;
}

/**
 * Places the Developer's Studio near the cottage: the portfolio's main
 * building, with clear ground in front of its door and a path out to the
 * nearest trail. Runs after the village, so it keeps out of its way.
 */
export const placeStudio: GenerationStep = (context) => {
  const { size, config } = context;
  const site = findSite(context);
  if (!site) return context;
  const area = siteArea(site.x, site.y, config.studio.frontClearanceTiles);
  const inArea = (x: number, y: number): boolean =>
    x >= area.left && x <= area.right && y >= area.top && y <= area.bottom;

  // Clear whatever stands on the site (trees, rocks, flowers).
  const layer = objectLayerWithout(context, (object) => {
    const { footprint } = OBJECT_REGISTRY[object.kind];
    for (let dy = 0; dy < footprint.height; dy++) {
      for (let dx = 0; dx < footprint.width; dx++) {
        if (inArea(object.x + dx, object.y + dy)) return true;
      }
    }
    return false;
  });
  const studio = addObject(layer, 'studio', site.x, site.y);

  const terrain = context.terrain.slice();
  const reserved = context.reserved.slice();
  const front = getDoorFrontTile(studio);
  for (const i of routeToTrail(context, layer, toIndex(size, front.x, front.y))) {
    terrain[i] = TileId.Path;
    reserved[i] = 1;
  }
  for (let y = area.top; y <= area.bottom; y++) {
    for (let x = area.left; x <= area.right; x++) reserved[toIndex(size, x, y)] = 1;
  }
  return {
    ...context,
    terrain,
    reserved,
    objects: layer.objects,
    occupancy: layer.occupancy,
    // Ids were renumbered when the site was cleared.
    cabin: layer.objects.find((object) => object.kind === 'cabin') ?? context.cabin,
  };
};
