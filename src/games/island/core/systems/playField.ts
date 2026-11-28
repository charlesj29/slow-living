// Where the kid and the puppy play: a patch of open land just outside the
// village (so the village itself stays calm), on the side nearest the kid's
// house. Pure.
import { CARDINAL_DIRECTIONS, forEachNeighbor } from '@/shared/engine/grid';
import { villageTiles } from '../world/village';
import type { World } from '../world/world';

export interface FieldSettings {
  /** How far outside the village edge the field lies (tiles, by walking steps). */
  readonly fieldTiles: { readonly min: number; readonly max: number };
  /** How big the field is: tiles this close to its middle (tiles). */
  readonly playRadiusTiles: number;
}

export function playField(
  world: World,
  walkable: ReadonlySet<number>,
  door: number,
  settings: FieldSettings,
): number[] {
  if (!world.village) return [];
  const village = new Set(villageTiles(world.village, world));
  // Walking steps out from the village edge, over open ground.
  const distance = new Map<number, number>();
  const queue: number[] = [];
  for (const tile of village) {
    distance.set(tile, 0);
    queue.push(tile);
  }
  const outside: number[] = [];
  for (const current of queue) {
    const d = distance.get(current) ?? 0;
    if (d >= settings.fieldTiles.max) continue;
    forEachNeighbor(world, current, CARDINAL_DIRECTIONS, (next) => {
      if (distance.has(next) || !walkable.has(next)) return;
      distance.set(next, d + 1);
      queue.push(next);
      if (d + 1 >= settings.fieldTiles.min) outside.push(next);
    });
  }
  if (outside.length === 0) return [];
  const at = (tile: number): [number, number] => [
    tile % world.width,
    Math.floor(tile / world.width),
  ];
  const [doorX, doorY] = at(door);
  const gap = (tile: number, x: number, y: number): number => {
    const [tx, ty] = at(tile);
    return Math.hypot(tx - x, ty - y);
  };
  // The middle of the field: the outside spot nearest the kid's door.
  const middle = outside.reduce((best, tile) =>
    gap(tile, doorX, doorY) < gap(best, doorX, doorY) ? tile : best,
  );
  const [mx, my] = at(middle);
  return outside.filter((tile) => gap(tile, mx, my) <= settings.playRadiusTiles);
}
