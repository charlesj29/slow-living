import { cellCount, isInBounds, toIndex } from '@/shared/engine/grid';
import { computeBlockedMask } from './collision';
import { MAP_FILE_VERSION } from './mapFile';
import { OBJECT_KINDS, OBJECT_REGISTRY, type ObjectKind } from './objects';
import { tileIdForMapChar } from './tiles';
import { NO_OBJECT, type World, type WorldObject } from './world';

/** Thrown when a map file is malformed; the message says what and where. */
export class MapFileError extends Error {
  override readonly name = 'MapFileError';
}

type UnknownRecord = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readInteger(record: UnknownRecord, key: string, where: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new MapFileError(`${where}: "${key}" must be an integer`);
  }
  return value;
}

function readArray(record: UnknownRecord, key: string, where: string): readonly unknown[] {
  const value = record[key];
  if (!Array.isArray(value)) throw new MapFileError(`${where}: "${key}" must be an array`);
  return value;
}

function isObjectKind(value: unknown): value is ObjectKind {
  return typeof value === 'string' && (OBJECT_KINDS as readonly string[]).includes(value);
}

/** Parses and checks a map file (format, sizes, known tiles/objects, no overlaps). */
export function parseMapFile(data: unknown): World {
  if (!isRecord(data)) throw new MapFileError('Map file must be a JSON object');
  const version = readInteger(data, 'version', 'map');
  if (version !== MAP_FILE_VERSION) {
    throw new MapFileError(`Unsupported map version ${String(version)}`);
  }
  const chunkSize = readInteger(data, 'chunkSize', 'map');
  const size = {
    width: readInteger(data, 'widthChunks', 'map') * chunkSize,
    height: readInteger(data, 'heightChunks', 'map') * chunkSize,
  };
  const terrain = new Uint8Array(cellCount(size));
  const filled = new Uint8Array(cellCount(size));
  const occupancy = new Int32Array(cellCount(size)).fill(NO_OBJECT);
  const objects: WorldObject[] = [];

  for (const [chunkIndex, chunk] of readArray(data, 'chunks', 'map').entries()) {
    const where = `chunk #${String(chunkIndex)}`;
    if (!isRecord(chunk)) throw new MapFileError(`${where} must be an object`);
    const left = readInteger(chunk, 'x', where) * chunkSize;
    const top = readInteger(chunk, 'y', where) * chunkSize;
    if (!isInBounds(size, left, top)) throw new MapFileError(`${where} lies outside the map`);

    const rows = readArray(chunk, 'rows', where);
    if (rows.length !== chunkSize)
      throw new MapFileError(`${where} must have ${String(chunkSize)} rows`);
    rows.forEach((row, dy) => {
      if (typeof row !== 'string' || row.length !== chunkSize) {
        throw new MapFileError(
          `${where} row ${String(dy)} must be ${String(chunkSize)} characters`,
        );
      }
      [...row].forEach((char, dx) => {
        const id = tileIdForMapChar(char);
        if (id === undefined)
          throw new MapFileError(`${where} row ${String(dy)}: unknown tile "${char}"`);
        const index = toIndex(size, left + dx, top + dy);
        terrain[index] = id;
        filled[index] = 1;
      });
    });

    for (const entry of readArray(chunk, 'objects', where)) {
      if (!Array.isArray(entry) || !isObjectKind(entry[0])) {
        throw new MapFileError(`${where}: invalid object ${JSON.stringify(entry)}`);
      }
      const [kind, dx, dy] = entry as [ObjectKind, unknown, unknown];
      if (typeof dx !== 'number' || typeof dy !== 'number') {
        throw new MapFileError(`${where}: object ${kind} needs numeric x and y`);
      }
      const object: WorldObject = { id: objects.length, kind, x: left + dx, y: top + dy };
      const { footprint } = OBJECT_REGISTRY[kind];
      for (let fy = 0; fy < footprint.height; fy++) {
        for (let fx = 0; fx < footprint.width; fx++) {
          const tx = object.x + fx;
          const ty = object.y + fy;
          if (!isInBounds(size, tx, ty) || occupancy[toIndex(size, tx, ty)] !== NO_OBJECT) {
            throw new MapFileError(
              `${where}: ${kind} at (${String(tx)}, ${String(ty)}) overlaps or is out of bounds`,
            );
          }
          occupancy[toIndex(size, tx, ty)] = object.id;
        }
      }
      objects.push(object);
    }
  }

  if (filled.includes(0)) throw new MapFileError('Map is missing chunks');
  const cabins = objects.filter((o) => o.kind === 'cabin');
  const cabin = cabins[0];
  if (cabins.length !== 1 || !cabin) throw new MapFileError('Map must contain exactly one cabin');
  const spawnEntry = readArray(data, 'spawn', 'map');
  const [spawnX, spawnY] = spawnEntry;
  if (
    typeof spawnX !== 'number' ||
    typeof spawnY !== 'number' ||
    !isInBounds(size, spawnX, spawnY)
  ) {
    throw new MapFileError('map: "spawn" must be [x, y] inside the map');
  }
  const source = isRecord(data.source) ? data.source : {};

  return {
    seed: typeof source.seed === 'number' ? source.seed : 0,
    generationSeed: typeof source.generationSeed === 'number' ? source.generationSeed : 0,
    width: size.width,
    height: size.height,
    terrain,
    objects,
    occupancy,
    blocked: computeBlockedMask(size, terrain, objects),
    cabin,
    spawn: { x: spawnX, y: spawnY },
  };
}
