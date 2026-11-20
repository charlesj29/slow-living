import {
  CARDINAL_DIRECTIONS,
  floodFill,
  forEachNeighbor,
  isInBounds,
  toIndex,
  type TilePoint,
} from '@/shared/engine/grid';
import { createFractalNoise2D } from '@/shared/engine/noise';
import { computeBlockedMask } from '../../world/collision';
import { isSeaTile, TileId } from '../../world/tiles';
import { getDoorFrontTile, NO_OBJECT } from '../../world/world';
import { createStepRng, type GenerationContext, type GenerationStep } from '../context';

type Run = TilePoint[];

function terrainAt(context: GenerationContext, x: number, y: number): number | undefined {
  return isInBounds(context.size, x, y) ? context.terrain[toIndex(context.size, x, y)] : undefined;
}

function nearTrail(context: GenerationContext, x: number, y: number): boolean {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const id = terrainAt(context, x + dx, y + dy);
      if (id === TileId.Path || id === TileId.Dock) return true;
    }
  }
  return false;
}

/** Sand connected (through sand) to the sea: real beaches, not the lake shore. */
function seaBeaches(context: GenerationContext): Uint8Array {
  const { size, terrain } = context;
  const seaside: number[] = [];
  terrain.forEach((id, i) => {
    if (id !== TileId.Sand) return;
    let touchesSea = false;
    forEachNeighbor(size, i, CARDINAL_DIRECTIONS, (n) => {
      touchesSea ||= isSeaTile(terrain[n] ?? 0);
    });
    if (touchesSea) seaside.push(i);
  });
  return floodFill(size, seaside, (i) => terrain[i] === TileId.Sand);
}

/** A ledge run may end against grass or beach (never water or a trail). */
const isLedgeSide = (id: number | undefined): boolean => id === TileId.Grass || id === TileId.Sand;

/**
 * A ledge goes on a free grass tile with grass behind it (north) and a sea
 * beach in front (south), between grass or beach tiles, away from trails. So the rock face
 * always looks down onto sand and the grass edge drapes over its top.
 */
function isLedgeSite(
  context: GenerationContext,
  beaches: Uint8Array,
  x: number,
  y: number,
): boolean {
  const index = toIndex(context.size, x, y);
  return (
    context.terrain[index] === TileId.Grass &&
    context.reserved[index] === 0 &&
    context.occupancy[index] === NO_OBJECT &&
    terrainAt(context, x, y - 1) === TileId.Grass &&
    beaches[toIndex(context.size, x, y + 1)] === 1 &&
    isLedgeSide(terrainAt(context, x - 1, y)) &&
    isLedgeSide(terrainAt(context, x + 1, y)) &&
    !nearTrail(context, x, y)
  );
}

/** Horizontal runs of chosen tiles, row by row. */
function collectRuns(context: GenerationContext, chosen: (x: number, y: number) => boolean): Run[] {
  const runs: Run[] = [];
  for (let y = 0; y < context.size.height; y++) {
    let run: Run = [];
    for (let x = 0; x <= context.size.width; x++) {
      if (x < context.size.width && chosen(x, y)) {
        run.push({ x, y });
      } else if (run.length > 0) {
        runs.push(run);
        run = [];
      }
    }
  }
  return runs;
}

/**
 * Rocky ledges on south-facing sea coasts (never the lake shore): noise picks stretches of coastline
 * where the grass ends in a short rock face above the beach. Ledges are
 * impassable, so any run that would cut a beach off from the cabin is
 * dropped again (the beach stays reachable around the ledge's ends).
 */
export const placeLedges: GenerationStep = (context) => {
  const { size, config, cabin } = context;
  if (!cabin) return context;
  const settings = config.ledges;
  const rng = createStepRng(context, 'placeLedges');
  const noise = createFractalNoise2D(rng.next, settings.noise);
  const beaches = seaBeaches(context);

  const runs = collectRuns(
    context,
    (x, y) => noise(x, y) > settings.threshold && isLedgeSite(context, beaches, x, y),
  ).filter((run) => run.length >= settings.minRunTiles);

  const terrain = context.terrain.slice();
  for (const run of runs) {
    for (const { x, y } of run) terrain[toIndex(size, x, y)] = TileId.Cliff;
  }

  const door = getDoorFrontTile(cabin);
  const blocked = computeBlockedMask(size, terrain, context.objects);
  const reached = floodFill(size, [toIndex(size, door.x, door.y)], (i) => blocked[i] === 0);
  for (const run of runs) {
    const cutsOffBeach = run.some(({ x, y }) => {
      const beach = toIndex(size, x, y + 1);
      return blocked[beach] === 0 && reached[beach] !== 1;
    });
    if (!cutsOffBeach) continue;
    for (const { x, y } of run) terrain[toIndex(size, x, y)] = TileId.Grass;
  }

  return { ...context, terrain };
};
