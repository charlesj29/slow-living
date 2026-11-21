import {
  CARDINAL_DIRECTIONS,
  EIGHT_DIRECTIONS,
  forEachNeighbor,
  toIndex,
} from '@/shared/engine/grid';
import { TileId } from '../../world/tiles';
import { villageTiles } from '../../world/village';
import { NO_OBJECT } from '../../world/world';
import { createStepRng, type GenerationStep } from '../context';
import { addObject, copyObjectLayer } from '../objectLayer';

/**
 * A signpost just outside the village gate, beside the trail (never on it),
 * pointing to the studio and the cottage. (The cottage's own sign by its gate
 * comes from decorateCabin.) Runs after the studio, so every landmark exists.
 */
export const placeSignposts: GenerationStep = (context) => {
  const { size, terrain, village } = context;
  if (!village) return context;
  const inside = new Set(villageTiles(village, size));
  const gate = toIndex(size, village.gate.x, village.gate.y);
  // The trail tile just outside the gate.
  let outside = -1;
  forEachNeighbor(size, gate, CARDINAL_DIRECTIONS, (n) => {
    if (!inside.has(n) && terrain[n] === TileId.Path) outside = n;
  });
  if (outside === -1) return context;

  const layer = copyObjectLayer(context);
  // Beside the trail: around the tile outside the gate (or one further out),
  // never on the trail, the fence or the line the trail leaves the gate on.
  const straight = outside + (outside - gate);
  const fenceLine = new Set<number>();
  forEachNeighbor(size, gate, CARDINAL_DIRECTIONS, (n) => fenceLine.add(n));
  const isSpot = (n: number): boolean =>
    n !== gate &&
    n !== straight &&
    !fenceLine.has(n) &&
    !inside.has(n) &&
    terrain[n] === TileId.Grass &&
    layer.occupancy[n] === NO_OBJECT;
  let spots: number[] = [];
  for (const around of [outside, straight]) {
    if (spots.length > 0) break;
    const found: number[] = [];
    forEachNeighbor(size, around, EIGHT_DIRECTIONS, (n) => {
      if (isSpot(n)) found.push(n);
    });
    spots = found;
  }
  if (spots.length === 0) return context;
  const spot = createStepRng(context, 'placeSignposts').pick(spots);
  addObject(layer, 'sign', spot % size.width, Math.floor(spot / size.width));
  return { ...context, objects: layer.objects, occupancy: layer.occupancy };
};
