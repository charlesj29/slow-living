// Going in and out of buildings. Walking up into an enterable door (registry:
// `interior`) fades out, swaps to that room and fades back in with you just
// inside; stepping onto the doormat takes you back out in front of the door.
// The swap happens while the screen is dark, so it never shows.
import { isInBounds, toIndex, type TilePoint } from '@/shared/engine/grid';
import type { Direction, HitboxSize, Player } from '../entities/player';
import { OBJECT_REGISTRY } from '../world/objects';
import { TileId } from '../world/tiles';
import { NO_OBJECT, type World, type WorldObject } from '../world/world';
import { reachPoint } from './interaction';

/** Where a transition takes the player. */
export interface Destination {
  readonly mapId: string;
  readonly tile: TilePoint;
  readonly facing: Direction;
}

export interface Transition {
  /** 'out' darkens the screen; the map swaps at its end; 'in' brightens it again. */
  phase: 'out' | 'in';
  elapsed: number;
  readonly to: Destination;
}

/** The building whose enterable door is right in front of the player, if any. */
export function doorAhead(
  world: World,
  player: Player,
  size: HitboxSize,
  reachPx: number,
  tileSizePx: number,
): WorldObject | null {
  const point = reachPoint(player, size, reachPx);
  const x = Math.floor(point.x / tileSizePx);
  const y = Math.floor(point.y / tileSizePx);
  if (!isInBounds(world, x, y)) return null;
  const object = world.objects[world.occupancy[toIndex(world, x, y)] ?? NO_OBJECT];
  if (!object) return null;
  const { door, interior } = OBJECT_REGISTRY[object.kind];
  if (!door || !interior) return null;
  return x === object.x + door.x && y === object.y + door.y ? object : null;
}

/** True when the player's feet are on a doormat (the way back out). */
export function onDoormat(world: World, player: Player, tileSizePx: number): boolean {
  const x = Math.floor(player.x / tileSizePx);
  const y = Math.floor(player.y / tileSizePx);
  return isInBounds(world, x, y) && world.terrain[toIndex(world, x, y)] === TileId.Doormat;
}

export function startTransition(to: Destination): Transition {
  return { phase: 'out', elapsed: 0, to };
}

/** Puts the player on a tile's centre, standing, facing the given way. */
export function placePlayer(
  player: Player,
  tile: TilePoint,
  facing: Direction,
  tileSizePx: number,
): void {
  player.x = (tile.x + 0.5) * tileSizePx;
  player.y = (tile.y + 0.5) * tileSizePx;
  player.previousX = player.x;
  player.previousY = player.y;
  player.facing = facing;
  player.moving = false;
  player.strideDistance = 0;
}
