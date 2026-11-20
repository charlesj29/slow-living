// Where each object's sprite goes: grouped by sprite key so each group can be
// one instanced mesh. Pure, so depth ordering is unit-tested.
import { OBJECT_REGISTRY } from '../core/world/objects';
import type { WorldObject } from '../core/world/world';
import { GROUND_DECAL_Z, standingSpriteZ, worldYFromMapPx } from './worldSpace';

export interface SpriteInstance {
  /** Centre of the sprite in world units. */
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface SpriteSize {
  readonly width: number;
  readonly height: number;
}

const FLAT_CATEGORIES = new Set(['flower', 'grass', 'ground']);

/**
 * Sprites stand on the bottom edge of their footprint, centred horizontally,
 * so tall sprites (tree crowns, the cabin roof) extend upwards.
 */
export function placeObjectSprites(
  objects: readonly WorldObject[],
  tileSizePx: number,
  spriteKeyFor: (object: WorldObject) => string,
  sizeOf: (key: string) => SpriteSize,
): Map<string, SpriteInstance[]> {
  const groups = new Map<string, SpriteInstance[]>();
  for (const object of objects) {
    const definition = OBJECT_REGISTRY[object.kind];
    const key = spriteKeyFor(object);
    const size = sizeOf(key);
    const footMapYPx = (object.y + definition.footprint.height) * tileSizePx;
    const centerX = (object.x + definition.footprint.width / 2) * tileSizePx;
    const instance: SpriteInstance = {
      x: centerX,
      y: worldYFromMapPx(footMapYPx) + size.height / 2,
      z: FLAT_CATEGORIES.has(definition.category) ? GROUND_DECAL_Z : standingSpriteZ(footMapYPx),
    };
    const group = groups.get(key) ?? [];
    group.push(instance);
    groups.set(key, group);
  }
  return groups;
}
