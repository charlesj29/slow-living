import { isInBounds, toIndex } from '@/shared/engine/grid';
import { OBJECT_REGISTRY } from '../../world/objects';
import { TileId } from '../../world/tiles';
import { getDoorFrontTile, NO_OBJECT } from '../../world/world';
import type { GenerationContext, GenerationStep } from '../context';
import { addObject, copyObjectLayer, type ObjectLayer } from '../objectLayer';

function isFreeGrass(
  context: GenerationContext,
  layer: ObjectLayer,
  x: number,
  y: number,
): boolean {
  if (!isInBounds(context.size, x, y)) return false;
  const index = toIndex(context.size, x, y);
  return context.terrain[index] === TileId.Grass && layer.occupancy[index] === NO_OBJECT;
}

/**
 * A small fenced front yard with a mailbox. The fence runs along the sides and
 * front of the cleared area in front of the cabin; trail tiles are left open,
 * so the fence never blocks the way out.
 */
export const decorateCabin: GenerationStep = (context) => {
  const { cabin, config } = context;
  if (!cabin) return context;
  const { footprint } = OBJECT_REGISTRY[cabin.kind];
  const { marginTiles, frontClearanceTiles } = config.cabin;
  const left = cabin.x - marginTiles;
  const right = cabin.x + footprint.width - 1 + marginTiles;
  const top = cabin.y + footprint.height;
  const bottom = cabin.y + footprint.height - 1 + Math.max(marginTiles, frontClearanceTiles);
  const layer = copyObjectLayer(context);

  const fenceTiles: { x: number; y: number }[] = [];
  for (let y = top; y <= bottom; y++) fenceTiles.push({ x: left, y }, { x: right, y });
  for (let x = left + 1; x < right; x++) fenceTiles.push({ x, y: bottom });
  for (const { x, y } of fenceTiles) {
    if (isFreeGrass(context, layer, x, y)) addObject(layer, 'fence', x, y);
  }

  const door = getDoorFrontTile(cabin);
  const mailboxSpots = [
    { x: door.x + 1, y: door.y },
    { x: door.x - 1, y: door.y },
    { x: door.x + 1, y: door.y + 1 },
    { x: door.x - 1, y: door.y + 1 },
  ];
  const spot = mailboxSpots.find(({ x, y }) => isFreeGrass(context, layer, x, y));
  if (spot) addObject(layer, 'mailbox', spot.x, spot.y);

  return { ...context, objects: layer.objects, occupancy: layer.occupancy };
};
