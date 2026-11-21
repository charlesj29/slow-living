// Where each object's soft shadow goes. Light comes from the top-left, so
// shadows sit at the object's base, nudged right (and buildings' shadows peek
// out to the right and below). Pure, so placement is unit-tested.
import { SHADOW_KEYS } from '../assets/paintShadows';
import { OBJECT_REGISTRY, type ObjectKind } from '../core/world/objects';
import type { WorldObject } from '../core/world/world';
import type { SpriteInstance } from './objectSprites';
import { SHADOW_Z, worldYFromMapPx } from './worldSpace';

export interface ShadowSpec {
  readonly key: string;
  /** Offset of the shadow's centre from the footprint's bottom-centre, in map pixels. */
  readonly offsetX: number;
  readonly offsetY: number;
}

/** Things lying flat on the ground (flowers, tufts) and thin posts cast no shadow. */
export const SHADOW_SPECS: Partial<Readonly<Record<ObjectKind, ShadowSpec>>> = {
  tree_oak: { key: SHADOW_KEYS.large, offsetX: 3, offsetY: -3 },
  tree_pine: { key: SHADOW_KEYS.large, offsetX: 3, offsetY: -3 },
  tree_giant: { key: SHADOW_KEYS.xlarge, offsetX: 4, offsetY: -4 },
  tree_small: { key: SHADOW_KEYS.medium, offsetX: 2, offsetY: -2 },
  bush: { key: SHADOW_KEYS.medium, offsetX: 2, offsetY: -2 },
  rock: { key: SHADOW_KEYS.small, offsetX: 2, offsetY: -2 },
  stump: { key: SHADOW_KEYS.small, offsetX: 2, offsetY: -2 },
  mailbox: { key: SHADOW_KEYS.small, offsetX: 2, offsetY: -1 },
  barrel: { key: SHADOW_KEYS.small, offsetX: 2, offsetY: -1 },
  flower_pot: { key: SHADOW_KEYS.small, offsetX: 2, offsetY: -1 },
  sign: { key: SHADOW_KEYS.small, offsetX: 2, offsetY: -1 },
  wood_pile: { key: SHADOW_KEYS.medium, offsetX: 2, offsetY: -2 },
  // The block covers the footprint, shifted right and down so it shows along those sides.
  cabin: { key: SHADOW_KEYS.cabin, offsetX: 10, offsetY: -27 },
  house_stone: { key: SHADOW_KEYS.house, offsetX: 9, offsetY: -19 },
  house_log: { key: SHADOW_KEYS.house, offsetX: 9, offsetY: -19 },
  house_thatch: { key: SHADOW_KEYS.house, offsetX: 9, offsetY: -19 },
  well: { key: SHADOW_KEYS.large, offsetX: 3, offsetY: -3 },
  haystack: { key: SHADOW_KEYS.medium, offsetX: 2, offsetY: -2 },
  crate: { key: SHADOW_KEYS.small, offsetX: 2, offsetY: -1 },
  lamp_post: { key: SHADOW_KEYS.small, offsetX: 2, offsetY: -1 },
  bed: { key: SHADOW_KEYS.large, offsetX: 3, offsetY: -2 },
  table: { key: SHADOW_KEYS.large, offsetX: 2, offsetY: -1 },
  chair: { key: SHADOW_KEYS.small, offsetX: 1, offsetY: -1 },
  plant: { key: SHADOW_KEYS.small, offsetX: 1, offsetY: -1 },
  floor_lamp: { key: SHADOW_KEYS.small, offsetX: 1, offsetY: -1 },
  studio: { key: SHADOW_KEYS.studio, offsetX: 10, offsetY: -27 },
  desk_laptop: { key: SHADOW_KEYS.large, offsetX: 2, offsetY: -1 },
  post_desk: { key: SHADOW_KEYS.large, offsetX: 2, offsetY: -1 },
};

/** The player's shadow, relative to the bottom of the feet. */
export const PLAYER_SHADOW: ShadowSpec = { key: SHADOW_KEYS.small, offsetX: 1, offsetY: -1 };

/** Shadow instances grouped by sprite key (one instanced mesh each). */
export function placeObjectShadows(
  objects: readonly WorldObject[],
  tileSizePx: number,
): Map<string, SpriteInstance[]> {
  const groups = new Map<string, SpriteInstance[]>();
  for (const object of objects) {
    const spec = SHADOW_SPECS[object.kind];
    if (!spec) continue;
    const { footprint } = OBJECT_REGISTRY[object.kind];
    const centerX = (object.x + footprint.width / 2) * tileSizePx + spec.offsetX;
    const footY = (object.y + footprint.height) * tileSizePx + spec.offsetY;
    const group = groups.get(spec.key) ?? [];
    group.push({ x: centerX, y: worldYFromMapPx(footY), z: SHADOW_Z });
    groups.set(spec.key, group);
  }
  return groups;
}
