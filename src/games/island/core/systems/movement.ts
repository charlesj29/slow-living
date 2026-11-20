// Player movement with tile collision. Each axis moves separately, so walking
// diagonally into a wall keeps sliding along it; walking straight into the
// corner of an obstacle nudges the player around it (no snagging on trees).
import { isTileBlocked } from '../world/collision';
import type { World } from '../world/world';
import { hitboxAt, type Box, type HitboxSize, type Player } from '../entities/player';
import type { MovementIntent } from './controls';

export interface MovementSettings extends HitboxSize {
  readonly walkSpeedTilesPerSecond: number;
  readonly runSpeedTilesPerSecond: number;
  readonly cornerSlidePx: number;
}

/** Keeps box edges that touch a tile boundary from counting as inside the next tile. */
const EDGE_EPSILON = 1e-6;
const MIN_MOVEMENT = 1e-4;

/** True if the box overlaps any blocked tile (anything outside the map counts as blocked). */
export function boxHitsBlocked(world: World, box: Box, tileSizePx: number): boolean {
  const firstColumn = Math.floor(box.left / tileSizePx);
  const lastColumn = Math.floor((box.right - EDGE_EPSILON) / tileSizePx);
  const firstRow = Math.floor(box.top / tileSizePx);
  const lastRow = Math.floor((box.bottom - EDGE_EPSILON) / tileSizePx);
  for (let row = firstRow; row <= lastRow; row++) {
    for (let column = firstColumn; column <= lastColumn; column++) {
      if (isTileBlocked(world, column, row)) return true;
    }
  }
  return false;
}

type Axis = 'x' | 'y';

function isFreeAt(
  world: World,
  x: number,
  y: number,
  settings: MovementSettings,
  tile: number,
): boolean {
  return !boxHitsBlocked(world, hitboxAt(x, y, settings), tile);
}

/**
 * Moves along one axis. If the full move would collide, stops flush against
 * the obstacle instead. Returns true if the move was not blocked.
 */
function moveAxis(
  player: Player,
  axis: Axis,
  delta: number,
  world: World,
  settings: MovementSettings,
  tile: number,
): boolean {
  if (delta === 0) return true;
  const target = player[axis] + delta;
  const free =
    axis === 'x'
      ? isFreeAt(world, target, player.y, settings, tile)
      : isFreeAt(world, player.x, target, settings, tile);
  if (free) {
    player[axis] = target;
    return true;
  }
  const half = (axis === 'x' ? settings.hitboxWidthPx : settings.hitboxHeightPx) / 2;
  const contact =
    delta > 0
      ? Math.floor((target + half - EDGE_EPSILON) / tile) * tile - half
      : (Math.floor((target - half) / tile) + 1) * tile + half;
  // Never step backwards (or past the target) while resolving.
  player[axis] =
    delta > 0
      ? Math.min(target, Math.max(player[axis], contact))
      : Math.max(target, Math.min(player[axis], contact));
  return false;
}

/**
 * When pushing straight into an obstacle whose corner is within
 * `cornerSlidePx`, shift sideways towards the open side by up to `step`.
 */
function slideAroundCorner(
  player: Player,
  axis: Axis,
  delta: number,
  step: number,
  world: World,
  settings: MovementSettings,
  tile: number,
): void {
  const side: Axis = axis === 'x' ? 'y' : 'x';
  for (let offset = 1; offset <= settings.cornerSlidePx; offset++) {
    for (const sign of [-1, 1]) {
      const shifted = player[side] + sign * offset;
      const sideX = side === 'x' ? shifted : player.x;
      const sideY = side === 'y' ? shifted : player.y;
      const aheadX = axis === 'x' ? sideX + delta : sideX;
      const aheadY = axis === 'y' ? sideY + delta : sideY;
      if (
        isFreeAt(world, sideX, sideY, settings, tile) &&
        isFreeAt(world, aheadX, aheadY, settings, tile)
      ) {
        moveAxis(player, side, sign * Math.min(step, offset), world, settings, tile);
        return;
      }
    }
  }
}

export function movePlayer(
  player: Player,
  intent: MovementIntent,
  world: World,
  stepSeconds: number,
  settings: MovementSettings,
  tileSizePx: number,
): void {
  const startX = player.x;
  const startY = player.y;
  player.running = intent.run;
  const length = Math.hypot(intent.dx, intent.dy);
  if (length > 0) {
    const speedTiles = intent.run
      ? settings.runSpeedTilesPerSecond
      : settings.walkSpeedTilesPerSecond;
    const step = speedTiles * tileSizePx * stepSeconds;
    const deltaX = (intent.dx / length) * step;
    const deltaY = (intent.dy / length) * step;
    const freeX = moveAxis(player, 'x', deltaX, world, settings, tileSizePx);
    const freeY = moveAxis(player, 'y', deltaY, world, settings, tileSizePx);
    if (!freeX && intent.dy === 0)
      slideAroundCorner(player, 'x', deltaX, step, world, settings, tileSizePx);
    if (!freeY && intent.dx === 0)
      slideAroundCorner(player, 'y', deltaY, step, world, settings, tileSizePx);
  }
  player.moving = Math.hypot(player.x - startX, player.y - startY) > MIN_MOVEMENT;
}
