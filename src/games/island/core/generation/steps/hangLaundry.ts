import { toIndex } from '@/shared/engine/grid';
import { OBJECT_REGISTRY } from '../../world/objects';
import { TileId } from '../../world/tiles';
import { villageHouses, villageTiles } from '../../world/village';
import { getDoorFrontTile, NO_OBJECT } from '../../world/world';
import { createStepRng, type GenerationStep } from '../context';
import { addObject, copyObjectLayer } from '../objectLayer';

/** A washing line is this many tiles long. */
const LINE_LENGTH = OBJECT_REGISTRY.laundry_line.footprint.width;
/** Lines hang this close to a house (tiles), and this far from each other. */
const NEAR_HOUSE_TILES = 3;
const APART_TILES = 5;
/** Rows behind a house's footprint its roof covers (a line there would look as if on the roof). */
const ROOF_ROWS = 2;

/**
 * Washing lines on the grass beside the village houses: on open grass inside
 * the village, off the paths, with a clear row in front and behind, never in
 * front of a door or behind a roof. Runs after everything else that places
 * objects (only spawn comes later), so adding it moves nothing on the island.
 */
export const hangLaundry: GenerationStep = (context) => {
  const { size, terrain, village, config } = context;
  if (!village || config.village.laundryLines <= 0) return context;
  const layer = copyObjectLayer(context);
  const inside = new Set(villageTiles(village, size));
  const houses = villageHouses({ objects: layer.objects });
  const keepClear = new Set<number>();
  for (const house of houses) {
    const door = getDoorFrontTile(house);
    keepClear.add(toIndex(size, door.x, door.y));
    keepClear.add(toIndex(size, door.x, door.y + 1));
    const { width } = OBJECT_REGISTRY[house.kind].footprint;
    for (let y = house.y - ROOF_ROWS; y < house.y; y++) {
      for (let x = house.x; x < house.x + width; x++) keepClear.add(toIndex(size, x, y));
    }
  }
  const openGrass = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= size.width || y >= size.height) return false;
    const i = toIndex(size, x, y);
    return (
      inside.has(i) &&
      terrain[i] === TileId.Grass &&
      layer.occupancy[i] === NO_OBJECT &&
      !keepClear.has(i)
    );
  };
  /** Nothing in the way along the row, or in the rows just in front and behind. */
  const roomy = (x: number, y: number): boolean => {
    for (let dx = -1; dx <= LINE_LENGTH; dx++) {
      for (const dy of [-1, 0, 1]) {
        const tx = x + dx;
        const ty = y + dy;
        const inRow = dy === 0 && dx >= 0 && dx < LINE_LENGTH;
        if (inRow ? !openGrass(tx, ty) : !openOrPath(tx, ty)) return false;
      }
    }
    return true;
  };
  const openOrPath = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= size.width || y >= size.height) return false;
    const i = toIndex(size, x, y);
    return inside.has(i) && layer.occupancy[i] === NO_OBJECT;
  };
  const nearHouse = (x: number, y: number): boolean =>
    houses.some((house) => {
      const { width, height } = OBJECT_REGISTRY[house.kind].footprint;
      const gapX = Math.max(house.x - (x + LINE_LENGTH - 1), 0, x - (house.x + width - 1));
      const gapY = Math.max(house.y - y, 0, y - (house.y + height - 1));
      return Math.max(gapX, gapY) <= NEAR_HOUSE_TILES;
    });
  const spots: { x: number; y: number }[] = [];
  for (const [y, left, right] of village.interior) {
    for (let x = left; x + LINE_LENGTH - 1 <= right; x++) {
      if (roomy(x, y) && nearHouse(x, y)) spots.push({ x, y });
    }
  }
  const rng = createStepRng(context, 'hangLaundry');
  const placed: { x: number; y: number }[] = [];
  while (placed.length < config.village.laundryLines) {
    const free = spots.filter((s) =>
      placed.every((p) => Math.abs(p.x - s.x) + Math.abs(p.y - s.y) >= APART_TILES),
    );
    if (free.length === 0) break;
    const spot = rng.pick(free);
    if (!roomy(spot.x, spot.y)) break;
    addObject(layer, 'laundry_line', spot.x, spot.y);
    placed.push(spot);
  }
  return { ...context, objects: layer.objects, occupancy: layer.occupancy };
};
