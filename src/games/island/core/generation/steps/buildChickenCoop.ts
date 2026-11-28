import { toIndex } from '@/shared/engine/grid';
import { isWalkableTile, TileId } from '../../world/tiles';
import { villageHouses, villageTiles } from '../../world/village';
import { getDoorFrontTile, NO_OBJECT } from '../../world/world';
import { createStepRng, type GenerationStep } from '../context';
import { addObject, objectLayerWithout } from '../objectLayer';
import { OBJECT_REGISTRY } from '../../world/objects';

/** The run, fence included (tiles); the hen house stands in its top-left corner inside. */
export const CHICKEN_RUN = { width: 7, height: 5 } as const;
/** A clear ring of walkable ground round the fence, so the run never cuts anyone's way. */
const MARGIN = 1;
/** The run stands just outside the village: at least this far from its tiles... */
const MIN_VILLAGE_GAP = 2;
/** ...and among the few spots nearest the bakery (or the village's middle), picked at random. */
const NEAREST_CHOICES = 3;
/** Meadow decorations (flowers, grass tufts, fallen branches) give way to the run. */
const SOFT = new Set(['flower', 'grass', 'ground']);

/**
 * A chicken run near the village: a fenced pen with a little hen house, on
 * open grass just outside the village (off the paths, with a clear walkway all
 * round), as near the bakery as there is room. Runs after everything else that
 * places objects (only spawn comes later), so adding it moves nothing else; only the meadow
 * flowers and tufts inside the pen are cleared.
 */
export const buildChickenCoop: GenerationStep = (context) => {
  const { size, terrain, village, config } = context;
  if (!village || !config.village.chickenCoop) return context;
  const inside = villageTiles(village, size);
  const insideSet = new Set(inside);
  const bakery = villageHouses({ objects: context.objects }).find((h) => h.kind === 'house_bakery');
  /** Nothing there, or only a meadow decoration that can make way. */
  const clear = (i: number): boolean => {
    const id = context.occupancy[i] ?? NO_OBJECT;
    const object = id === NO_OBJECT ? undefined : context.objects[id];
    return !object || SOFT.has(OBJECT_REGISTRY[object.kind].category);
  };
  const anchor = bakery
    ? getDoorFrontTile(bakery)
    : {
        x: Math.round(inside.reduce((s, t) => s + (t % size.width), 0) / inside.length),
        y: Math.round(inside.reduce((s, t) => s + Math.floor(t / size.width), 0) / inside.length),
      };
  const at = (x: number, y: number): number | null =>
    x < 0 || y < 0 || x >= size.width || y >= size.height ? null : toIndex(size, x, y);
  const nearVillage = (x: number, y: number): boolean => {
    for (let dy = -MIN_VILLAGE_GAP; dy <= MIN_VILLAGE_GAP; dy++) {
      for (let dx = -MIN_VILLAGE_GAP; dx <= MIN_VILLAGE_GAP; dx++) {
        const i = at(x + dx, y + dy);
        if (i !== null && insideSet.has(i)) return true;
      }
    }
    return false;
  };
  /** The pen's own tiles: open grass, off the paths, clear of the village. */
  const penTile = (x: number, y: number): boolean => {
    const i = at(x, y);
    return i !== null && terrain[i] === TileId.Grass && clear(i) && !nearVillage(x, y);
  };
  /** The ring round it: open, walkable ground. */
  const walkway = (x: number, y: number): boolean => {
    const i = at(x, y);
    return i !== null && isWalkableTile(terrain[i] ?? 0) && clear(i);
  };
  const fits = (left: number, top: number): boolean => {
    for (let y = top - MARGIN; y < top + CHICKEN_RUN.height + MARGIN; y++) {
      for (let x = left - MARGIN; x < left + CHICKEN_RUN.width + MARGIN; x++) {
        const ring =
          x < left || y < top || x >= left + CHICKEN_RUN.width || y >= top + CHICKEN_RUN.height;
        if (ring ? !walkway(x, y) : !penTile(x, y)) return false;
      }
    }
    return true;
  };
  const spots: { x: number; y: number; distance: number }[] = [];
  for (let top = MARGIN; top + CHICKEN_RUN.height + MARGIN <= size.height; top++) {
    for (let left = MARGIN; left + CHICKEN_RUN.width + MARGIN <= size.width; left++) {
      if (!fits(left, top)) continue;
      const cx = left + CHICKEN_RUN.width / 2;
      const cy = top + CHICKEN_RUN.height / 2;
      spots.push({ x: left, y: top, distance: Math.hypot(cx - anchor.x, cy - anchor.y) });
    }
  }
  if (spots.length === 0) return context;
  spots.sort((a, b) => a.distance - b.distance);
  const rng = createStepRng(context, 'buildChickenCoop');
  const spot = rng.pick(spots.slice(0, NEAREST_CHOICES));
  const inPen = (x: number, y: number): boolean =>
    x >= spot.x && y >= spot.y && x < spot.x + CHICKEN_RUN.width && y < spot.y + CHICKEN_RUN.height;
  const layer = objectLayerWithout(
    context,
    (o) => SOFT.has(OBJECT_REGISTRY[o.kind].category) && inPen(o.x, o.y),
  );
  // The fence all round, then the hen house in the top-left corner inside.
  for (let y = spot.y; y < spot.y + CHICKEN_RUN.height; y++) {
    for (let x = spot.x; x < spot.x + CHICKEN_RUN.width; x++) {
      const edge =
        x === spot.x ||
        y === spot.y ||
        x === spot.x + CHICKEN_RUN.width - 1 ||
        y === spot.y + CHICKEN_RUN.height - 1;
      if (edge) addObject(layer, 'fence', x, y);
    }
  }
  addObject(layer, 'chicken_coop', spot.x + 1, spot.y + 1);
  return { ...context, objects: layer.objects, occupancy: layer.occupancy };
};
