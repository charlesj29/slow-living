// Interacting with things: the player reaches a little way past their feet in
// the direction they face; whatever interactive thing is there can be talked
// to / checked with E, which opens a message (no reply choices).
import { isInBounds, toIndex } from '@/shared/engine/grid';
import { hitboxAt, type HitboxSize, type Player } from '../entities/player';
import { OBJECT_REGISTRY } from '../world/objects';
import { NO_OBJECT, type World, type WorldObject } from '../world/world';

/** Something the player can interact with right now. */
export interface InteractTarget {
  readonly object: WorldObject;
  readonly message: string;
}

export interface Dialog {
  readonly message: string;
}

const FACING_STEP = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
} as const;

/** The map point just in front of the player's feet. */
export function reachPoint(
  player: Player,
  size: HitboxSize,
  reachPx: number,
): { x: number; y: number } {
  const box = hitboxAt(player.x, player.y, size);
  const step = FACING_STEP[player.facing];
  return {
    x: player.x + step.dx * ((box.right - box.left) / 2 + reachPx),
    y: player.y + step.dy * ((box.bottom - box.top) / 2 + reachPx),
  };
}

/** The interactive object in front of the player, if any. */
export function findInteractTarget(
  world: World,
  player: Player,
  size: HitboxSize,
  reachPx: number,
  tileSizePx: number,
): InteractTarget | null {
  const point = reachPoint(player, size, reachPx);
  const tileX = Math.floor(point.x / tileSizePx);
  const tileY = Math.floor(point.y / tileSizePx);
  if (!isInBounds(world, tileX, tileY)) return null;
  const id = world.occupancy[toIndex(world, tileX, tileY)] ?? NO_OBJECT;
  const object = id === NO_OBJECT ? undefined : world.objects[id];
  const interaction = object ? OBJECT_REGISTRY[object.kind].interaction : undefined;
  return object && interaction ? { object, message: interaction.message } : null;
}
