// Plans a village in its own little grid (fence ring included, (0, 0) at the
// top-left), before it is placed on the island: a random-sized inside with
// corners notched away (an irregular, sometimes L-shaped outline), the fence
// round it, and three houses that keep open grass between them and the fence.
// Pure: randomness comes from the step's rng.
import type { Rng } from '@/shared/engine/random';
import type { IslandConfig, Range } from '../config';
import { OBJECT_REGISTRY, type ObjectKind } from '../world/objects';
import { VILLAGE_HOUSE_KINDS } from '../world/village';

export interface PlannedHouse {
  readonly kind: ObjectKind;
  readonly x: number;
  readonly y: number;
}

export interface VillagePlan {
  /** Grid size, fence ring included. */
  readonly width: number;
  readonly height: number;
  /** 1 = inside the fence. */
  readonly inside: Uint8Array;
  /** 1 = a fence tile. */
  readonly fence: Uint8Array;
  /** For inside tiles: steps (diagonals included) to the nearest fence tile (1 = next to it). */
  readonly fenceDistance: Int32Array;
  readonly houses: readonly PlannedHouse[];
}

type Settings = IslandConfig['village'];

const pickIn = (rng: Rng, range: Range): number => rng.int(range.min, range.max);
/** Houses after the first pick among this share of spots farthest from the others. */
const SPREAD_SHARE = 0.2;

/** Fisher–Yates: a fair random order. */
export function shuffled<T>(rng: Rng, items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const a = result[i];
    const b = result[j];
    if (a === undefined || b === undefined) continue;
    result[i] = b;
    result[j] = a;
  }
  return result;
}

interface Rect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

const overlap = (a: Rect, b: Rect): boolean =>
  a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom;

/** The inside: a rectangle with up to `maxNotches` corners cut away. */
function planShape(
  rng: Rng,
  settings: Settings,
): { width: number; height: number; inside: Uint8Array } {
  const innerWidth = pickIn(rng, settings.interiorWidth);
  const innerHeight = pickIn(rng, settings.interiorHeight);
  const width = innerWidth + 2;
  const height = innerHeight + 2;
  const inside = new Uint8Array(width * height);
  for (let y = 1; y <= innerHeight; y++) {
    for (let x = 1; x <= innerWidth; x++) inside[y * width + x] = 1;
  }
  const corners = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ] as const;
  const order = shuffled(rng, corners);
  const notches = rng.int(0, settings.maxNotches);
  for (const [right, bottom] of order.slice(0, notches)) {
    const w = pickIn(rng, settings.notchWidth);
    const h = pickIn(rng, settings.notchHeight);
    const left = right ? innerWidth - w + 1 : 1;
    const top = bottom ? innerHeight - h + 1 : 1;
    for (let y = top; y < top + h; y++) {
      for (let x = left; x < left + w; x++) inside[y * width + x] = 0;
    }
  }
  return { width, height, inside };
}

/** Fence tiles: outside the inside, touching it (diagonals too, so corners close). */
function traceFence(width: number, height: number, inside: Uint8Array): Uint8Array {
  const fence = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (inside[y * width + x]) continue;
      for (let dy = -1; dy <= 1 && !fence[y * width + x]; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < width && ny < height && inside[ny * width + nx]) {
            fence[y * width + x] = 1;
            break;
          }
        }
      }
    }
  }
  return fence;
}

function distancesFrom(
  width: number,
  height: number,
  fence: Uint8Array,
  inside: Uint8Array,
): Int32Array {
  const distance = new Int32Array(width * height).fill(-1);
  const queue: number[] = [];
  fence.forEach((isFence, i) => {
    if (isFence) {
      distance[i] = 0;
      queue.push(i);
    }
  });
  for (const i of queue) {
    const x = i % width;
    const y = Math.floor(i / width);
    // Diagonals count as one step, so the gap holds round notched corners too.
    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
      [x + 1, y + 1],
      [x - 1, y - 1],
      [x + 1, y - 1],
      [x - 1, y + 1],
    ] as const) {
      const n = ny * width + nx;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (!inside[n] || (distance[n] ?? -1) !== -1) continue;
      distance[n] = (distance[i] ?? 0) + 1;
      queue.push(n);
    }
  }
  return distance;
}

/** Of the possible spots, the fifth farthest from the houses already placed, so they spread out. */
function spreadOut(
  spots: readonly PlannedHouse[],
  placed: readonly PlannedHouse[],
): PlannedHouse[] {
  if (placed.length === 0) return [...spots];
  const nearest = (spot: PlannedHouse): number =>
    Math.min(...placed.map((house) => Math.hypot(spot.x - house.x, spot.y - house.y)));
  const ranked = [...spots].sort((a, b) => nearest(b) - nearest(a));
  return ranked.slice(0, Math.max(1, Math.ceil(ranked.length * SPREAD_SHARE)));
}

/**
 * Three houses, spread out, at random spots where the house and its roof keep at least
 * \`gap\` tiles from the fence and its door step is inside. Each house has a
 * lot (roof row above, step and path row below, a tile either side) and lots
 * never overlap, so houses always stand at least two tiles apart.
 */
function planHouses(
  rng: Rng,
  width: number,
  height: number,
  inside: Uint8Array,
  fenceDistance: Int32Array,
  gap: number,
): PlannedHouse[] | null {
  const kinds = shuffled(rng, VILLAGE_HOUSE_KINDS);
  const lots: Rect[] = [];
  const houses: PlannedHouse[] = [];
  const roomy = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < width && y < height && (fenceDistance[y * width + x] ?? -1) > gap;
  for (const kind of kinds) {
    const { footprint, door } = OBJECT_REGISTRY[kind];
    const spots: PlannedHouse[] = [];
    for (let y = 1; y < height; y++) {
      for (let x = 1; x < width; x++) {
        const lot = {
          left: x - 1,
          top: y - 1,
          right: x + footprint.width,
          bottom: y + footprint.height + 1,
        };
        if (lots.some((other) => overlap(lot, other))) continue;
        let fits = true;
        for (let dy = -1; dy < footprint.height && fits; dy++) {
          for (let dx = 0; dx < footprint.width && fits; dx++) fits = roomy(x + dx, y + dy);
        }
        const stepX = x + (door?.x ?? 0);
        const stepY = y + (door?.y ?? 0) + 1;
        if (fits && inside[stepY * width + stepX]) spots.push({ kind, x, y });
      }
    }
    if (spots.length === 0) return null;
    const spot = rng.pick(spreadOut(spots, houses));
    houses.push(spot);
    lots.push({
      left: spot.x - 1,
      top: spot.y - 1,
      right: spot.x + footprint.width,
      bottom: spot.y + footprint.height + 1,
    });
  }
  return houses;
}

/** A complete plan, or null when this shape is too cramped for three houses. */
export function planVillage(rng: Rng, settings: Settings): VillagePlan | null {
  const { width, height, inside } = planShape(rng, settings);
  const fence = traceFence(width, height, inside);
  const fenceDistance = distancesFrom(width, height, fence, inside);
  const gap = pickIn(rng, settings.gapTiles);
  const houses = planHouses(rng, width, height, inside, fenceDistance, gap);
  return houses ? { width, height, inside, fence, fenceDistance, houses } : null;
}
