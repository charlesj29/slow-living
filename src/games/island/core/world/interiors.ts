// Interiors: small hand-made rooms behind enterable doors (registry:
// `interior`). Each is plain data — tile rows (w wall, f floor, d doormat),
// furniture, where you appear and the doormat that takes you back out — and
// becomes a `World` the game walks exactly like the island.
import { cellCount, toIndex, type TilePoint } from '@/shared/engine/grid';
import type { Direction } from '../entities/player';
import { computeBlockedMask } from './collision';
import { OBJECT_REGISTRY, type ObjectKind } from './objects';
import { tileIdForMapChar } from './tiles';
import { NO_OBJECT, type World, type WorldObject } from './world';

export interface InteriorDefinition {
  readonly id: string;
  readonly rows: readonly string[];
  readonly furniture: readonly {
    readonly kind: ObjectKind;
    readonly x: number;
    readonly y: number;
  }[];
  /** Where you stand after walking in, and which way you face. */
  readonly entry: TilePoint & { readonly facing: Direction };
}

/**
 * Your cottage, inside: bookshelf, fireplace and bed along the back wall, a
 * rug by the fire, a table with chairs, plants and a reading lamp.
 */
const COTTAGE: InteriorDefinition = {
  id: 'cottage',
  // prettier-ignore
  rows: [
    'wwwwwwwwwwwwww',
    'wwwwwwwwwwwwww',
    'wffffffffffffw',
    'wffffffffffffw',
    'wffffffffffffw',
    'wffffffffffffw',
    'wffffffffffffw',
    'wffffffffffffw',
    'wffffffffffffw',
    'wwwwwwdwwwwwww',
  ],
  furniture: [
    { kind: 'bookshelf', x: 2, y: 2 },
    { kind: 'fireplace', x: 6, y: 2 },
    { kind: 'bed', x: 10, y: 2 },
    { kind: 'floor_lamp', x: 12, y: 2 },
    { kind: 'plant', x: 1, y: 2 },
    { kind: 'rug', x: 5, y: 4 },
    { kind: 'table', x: 2, y: 6 },
    { kind: 'chair', x: 1, y: 6 },
    { kind: 'chair', x: 4, y: 6 },
    { kind: 'plant', x: 1, y: 8 },
    { kind: 'plant', x: 12, y: 8 },
  ],
  entry: { x: 6, y: 8, facing: 'up' },
};

/**
 * The Developer's Studio: every piece is part of the portfolio. Framed
 * certificates, a wall of phones (the apps) and a timeline hang on the back
 * wall; a tech bookshelf and a trophy shelf stand by the side walls; the desk
 * with the laptop and the post desk face the room around a rug.
 */
const STUDIO: InteriorDefinition = {
  id: 'studio',
  // prettier-ignore
  rows: [
    'wwwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwwww',
    'wfffffffffffffffw',
    'wfffffffffffffffw',
    'wfffffffffffffffw',
    'wfffffffffffffffw',
    'wfffffffffffffffw',
    'wfffffffffffffffw',
    'wfffffffffffffffw',
    'wfffffffffffffffw',
    'wfffffffffffffffw',
    'wwwwwwwwdwwwwwwww',
  ],
  furniture: [
    { kind: 'certificates', x: 2, y: 1 },
    { kind: 'phone_wall', x: 6, y: 1 },
    { kind: 'timeline_board', x: 12, y: 1 },
    { kind: 'plant', x: 1, y: 2 },
    { kind: 'floor_lamp', x: 15, y: 2 },
    { kind: 'tech_shelf', x: 1, y: 4 },
    { kind: 'trophy_shelf', x: 14, y: 4 },
    { kind: 'rug', x: 7, y: 5 },
    { kind: 'chair', x: 4, y: 6 },
    { kind: 'desk_laptop', x: 3, y: 7 },
    { kind: 'post_desk', x: 12, y: 7 },
    { kind: 'plant', x: 1, y: 10 },
    { kind: 'plant', x: 15, y: 10 },
  ],
  entry: { x: 8, y: 10, facing: 'up' },
};

export const INTERIORS: Readonly<Record<string, InteriorDefinition>> = {
  cottage: COTTAGE,
  studio: STUDIO,
};

/** Builds a walkable world from an interior's rows and furniture. */
export function buildInteriorWorld(definition: InteriorDefinition): World {
  const height = definition.rows.length;
  const width = definition.rows[0]?.length ?? 0;
  const size = { width, height };
  const terrain = new Uint8Array(
    definition.rows.flatMap((row) =>
      [...row].map((char) => {
        const id = tileIdForMapChar(char);
        if (id === undefined)
          throw new Error(`Interior "${definition.id}": unknown tile "${char}"`);
        return id;
      }),
    ),
  );
  const objects: WorldObject[] = definition.furniture.map((item, id) => ({ id, ...item }));
  const occupancy = new Int32Array(cellCount(size)).fill(NO_OBJECT);
  for (const object of objects) {
    const { footprint } = OBJECT_REGISTRY[object.kind];
    for (let dy = 0; dy < footprint.height; dy++) {
      for (let dx = 0; dx < footprint.width; dx++) {
        occupancy[toIndex(size, object.x + dx, object.y + dy)] = object.id;
      }
    }
  }
  return {
    seed: 0,
    generationSeed: 0,
    width,
    height,
    terrain,
    objects,
    occupancy,
    blocked: computeBlockedMask(size, terrain, objects),
    cabin: null,
    spawn: { x: definition.entry.x, y: definition.entry.y },
    village: null,
    indoor: true,
  };
}
