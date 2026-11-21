import { isInBounds, toIndex } from '@/shared/engine/grid';
import { OBJECT_REGISTRY, type ObjectKind } from '../../world/objects';
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
 * Cosy clutter around the cottage (a bench by the steps, a vegetable patch at
 * the side), as offsets from the footprint's top-left
 * (the door is at x 2 on the bottom row, so y = height is the row in front of
 * it). All spots lie inside the cabin's reserved area, off the trail; a spot
 * that isn't free grass is simply skipped, so props never block the way.
 */
const HOUSE_PROPS: readonly { kind: ObjectKind; dx: number; dy: number }[] = [
  { kind: 'bush', dx: 0, dy: 4 },
  { kind: 'flower_pot', dx: 1, dy: 4 },
  // A bench by the steps, to sit and look at the lake.
  { kind: 'bench', dx: 4, dy: 4 },
  { kind: 'wood_pile', dx: 6, dy: 3 },
  { kind: 'sign', dx: 1, dy: 5 },
  { kind: 'stepping_stone', dx: 3, dy: 5 },
  { kind: 'stepping_stone', dx: 4, dy: 5 },
  // A little vegetable garden along the cottage's right side, above the wood pile.
  { kind: 'crops', dx: 6, dy: 0 },
  { kind: 'crops', dx: 6, dy: 1 },
  { kind: 'crops', dx: 6, dy: 2 },
];

/**
 * A small fenced front yard with a mailbox and props. The fence runs along the sides and
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

  for (const { kind, dx, dy } of HOUSE_PROPS) {
    const x = cabin.x + dx;
    const y = cabin.y + dy;
    // Every tile it covers must be free grass (the bench is two wide).
    const width = OBJECT_REGISTRY[kind].footprint.width;
    const free = Array.from({ length: width }, (_, i) => isFreeGrass(context, layer, x + i, y));
    if (free.every(Boolean)) addObject(layer, kind, x, y);
  }

  return { ...context, objects: layer.objects, occupancy: layer.occupancy };
};
