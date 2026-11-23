// Which way a thumb on the slide-stick points: the direction of the bigger offset
// from the stick's middle (one direction at a time, like the keyboard: no
// diagonals), or none while it rests near the middle.
import type { Direction } from '../core/entities/player';

/**
 * `dx`, `dy`: the thumb's offset from the stick's middle (screen pixels, y down);
 * `radius`: the stick's reach; `deadZone`: the resting part, as a share of it.
 */
export function stickDirection(
  dx: number,
  dy: number,
  radius: number,
  deadZone: number,
): Direction | null {
  if (Math.hypot(dx, dy) < radius * deadZone) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}
