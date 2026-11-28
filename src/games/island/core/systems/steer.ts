// Steering with a held finger (phones): which way to walk to get to the point
// under the finger. Four ways, like the keyboard; it keeps going the way it
// already goes until it has lined up on that axis, so steering diagonally
// walks a clean "L" instead of zig-zagging. Stops close to the finger. Pure.
import type { Direction } from '../entities/player';

export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * The direction from `from` towards `to` (map pixels), or null once within
 * `stopPx` of it. `current` is the way it walks now (kept while it still helps).
 */
export function steerDirection(
  from: Point,
  to: Point,
  current: Direction | null,
  stopPx: number,
): Direction | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.hypot(dx, dy) <= stopPx) return null;
  const lined = stopPx / 2;
  const horizontal = dx > 0 ? 'right' : 'left';
  const vertical = dy > 0 ? 'down' : 'up';
  // Carry on along the current axis until lined up with the finger on it.
  if ((current === 'left' || current === 'right') && Math.abs(dx) > lined) return horizontal;
  if ((current === 'up' || current === 'down') && Math.abs(dy) > lined) return vertical;
  return Math.abs(dx) >= Math.abs(dy) ? horizontal : vertical;
}
