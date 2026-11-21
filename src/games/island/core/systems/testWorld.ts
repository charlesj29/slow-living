// Builds small hand-drawn worlds for system tests (not used by production code).
import { computeBlockedMask } from '../world/collision';
import { OBJECT_REGISTRY, type ObjectKind } from '../world/objects';
import { tileIdForMapChar } from '../world/tiles';
import { NO_OBJECT, type World, type WorldObject } from '../world/world';

export const TEST_TILE = 16;

/**
 * Rows use map-file tile characters (`,` grass, `.` sand, `-` water, `=` path,
 * `#` dock). Objects are placed by kind at tile coordinates.
 */
export function makeTestWorld(
  rows: readonly string[],
  objects: readonly { kind: ObjectKind; x: number; y: number }[] = [],
): World {
  const width = rows[0]?.length ?? 0;
  const height = rows.length;
  const terrain = new Uint8Array(
    rows
      .join('')
      .split('')
      .map((char) => {
        const id = tileIdForMapChar(char);
        if (id === undefined) throw new Error(`Unknown tile "${char}"`);
        return id;
      }),
  );
  const placed: WorldObject[] = objects.map((o, id) => ({ id, ...o }));
  const occupancy = new Int32Array(width * height).fill(NO_OBJECT);
  for (const object of placed) {
    const { footprint } = OBJECT_REGISTRY[object.kind];
    for (let dy = 0; dy < footprint.height; dy++) {
      for (let dx = 0; dx < footprint.width; dx++) {
        occupancy[(object.y + dy) * width + object.x + dx] = object.id;
      }
    }
  }
  const size = { width, height };
  return {
    seed: 0,
    generationSeed: 0,
    width,
    height,
    terrain,
    objects: placed,
    occupancy,
    blocked: computeBlockedMask(size, terrain, placed),
    cabin: placed.find((o) => o.kind === 'cabin') ?? { id: -1, kind: 'cabin', x: 0, y: 0 },
    spawn: { x: 1, y: 1 },
    village: null,
  };
}

/** The tile indexes of a rectangle (a stand-in village interior for tests). */
export function areaTiles(
  area: { left: number; top: number; right: number; bottom: number },
  width: number,
): number[] {
  const tiles: number[] = [];
  for (let y = area.top; y <= area.bottom; y++) {
    for (let x = area.left; x <= area.right; x++) tiles.push(y * width + x);
  }
  return tiles;
}
