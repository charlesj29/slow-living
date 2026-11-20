import { isInBounds, toIndex } from '@/shared/engine/grid';
import { createFractalNoise2D } from '@/shared/engine/noise';
import { OBJECT_REGISTRY, type ObjectKind } from '../../world/objects';
import { TileId } from '../../world/tiles';
import { NO_OBJECT } from '../../world/world';
import { createStepRng, type GenerationContext, type GenerationStep } from '../context';
import { addObject, copyObjectLayer, type ObjectLayer } from '../objectLayer';

const SPECIES_SPLIT = 0.5;
/**
 * Tiles a tree's crown covers beyond its trunk footprint, in tiles: how far it
 * spreads left/right of the footprint and how many rows it rises above it.
 * Must match the sprite sizes (big 32×32, giant 48×48, small 16×32).
 */
const CROWN_EXTENTS: Partial<Readonly<Record<ObjectKind, { side: number; up: number }>>> = {
  tree_oak: { side: 0, up: 1 },
  tree_pine: { side: 0, up: 1 },
  tree_giant: { side: 1, up: 2 },
  tree_small: { side: 0, up: 1 },
};

function canPlace(
  context: GenerationContext,
  layer: ObjectLayer,
  kind: ObjectKind,
  x: number,
  y: number,
): boolean {
  const { footprint } = OBJECT_REGISTRY[kind];
  // Crowns may overhang grass and other trees, but never reserved tiles, so
  // trails and the cabin yard (fence, mailbox) stay visible.
  const crown = CROWN_EXTENTS[kind];
  if (crown) {
    for (let dy = 0; dy <= crown.up; dy++) {
      for (let dx = -crown.side; dx < footprint.width + crown.side; dx++) {
        if (dy === 0 && dx >= 0 && dx < footprint.width) continue; // the trunk row itself
        const tx = x + dx;
        const ty = y - dy;
        if (
          isInBounds(context.size, tx, ty) &&
          context.reserved[toIndex(context.size, tx, ty)] === 1
        ) {
          return false;
        }
      }
    }
  }
  for (let dy = 0; dy < footprint.height; dy++) {
    for (let dx = 0; dx < footprint.width; dx++) {
      const tx = x + dx;
      const ty = y + dy;
      if (!isInBounds(context.size, tx, ty)) return false;
      const index = toIndex(context.size, tx, ty);
      if (context.terrain[index] !== TileId.Grass) return false;
      if (context.reserved[index] === 1 || layer.occupancy[index] !== NO_OBJECT) return false;
    }
  }
  return true;
}

/**
 * Forests come from low-frequency noise. Where a forest's core meets a
 * "dense" character, big trees are packed on a staggered 2-tile grid so their
 * crowns interlock into a solid canopy (classic RPG forest walls); elsewhere
 * forests are loose mixes of big and small trees you can weave through.
 * Meadows get the odd lone tree or bush. A species noise groups oaks and pines.
 */
export const scatterTrees: GenerationStep = (context) => {
  const { size, config } = context;
  const settings = config.trees;
  const rng = createStepRng(context, 'scatterTrees');
  const forest = createFractalNoise2D(rng.next, settings.forestNoise);
  const character = createFractalNoise2D(rng.next, settings.characterNoise);
  const species = createFractalNoise2D(rng.next, settings.speciesNoise);
  const layer = copyObjectLayer(context);
  const bigKindAt = (x: number, y: number): ObjectKind => {
    if (species(x, y) <= SPECIES_SPLIT) return 'tree_pine';
    return rng.chance(settings.giantShare) ? 'tree_giant' : 'tree_oak';
  };
  const tryPlace = (kind: ObjectKind, x: number, y: number): boolean => {
    if (!canPlace(context, layer, kind, x, y)) return false;
    addObject(layer, kind, x, y);
    return true;
  };

  // Pass 1: dense canopy. Rows alternate their 2-tile grid offset, so every
  // row is fully covered and each row's crowns overlap the trunks behind them.
  for (let y = 0; y < size.height; y++) {
    for (let x = y % 2; x < size.width; x += 2) {
      const isDense =
        forest(x, y) > settings.denseThreshold && character(x, y) > settings.characterThreshold;
      if (isDense) tryPlace(bigKindAt(x, y), x, y);
    }
  }

  // Pass 2: loose forest and meadows.
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (!canPlace(context, layer, 'tree_small', x, y)) continue;
      const inForest = forest(x, y) > settings.forestThreshold;
      const treeChance = inForest ? settings.looseDensity : settings.meadowTreeChance;
      if (rng.chance(treeChance)) {
        const wantsBig = rng.chance(settings.bigTreeShare);
        if (!(wantsBig && tryPlace(bigKindAt(x, y), x, y))) tryPlace('tree_small', x, y);
      } else if (!inForest && rng.chance(settings.meadowBushChance)) {
        tryPlace('bush', x, y);
      }
    }
  }

  return { ...context, objects: layer.objects, occupancy: layer.occupancy };
};
