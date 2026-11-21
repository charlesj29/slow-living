import { isHeld, latestHeld, type InputState, type KeyBindings } from '@/shared/engine/input';
import type { Direction } from '../entities/player';

export type IslandAction = Direction | 'run' | 'interact';

/** Arrow keys or WASD to walk; either Shift to run; Space to interact. */
export const ISLAND_KEY_BINDINGS: KeyBindings<IslandAction> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  Space: 'interact',
};

const DIRECTION_ACTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'];

/** Unit step per direction in map coordinates (+y is down). */
const DIRECTION_STEPS: Readonly<Record<Direction, { readonly dx: number; readonly dy: number }>> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export interface MovementIntent {
  /** −1, 0 or 1 on each axis (map coordinates: +y is down). */
  readonly dx: number;
  readonly dy: number;
  readonly run: boolean;
  /** The most recently pressed direction still held: the way the player faces. */
  readonly facing: Direction | undefined;
}

/**
 * Classic 4-way movement: only one direction is active at a time — the most
 * recently pressed key that is still held. Releasing it falls back to the
 * previous held key; opposite keys don't cancel out (the newer one wins).
 */
export function readMovementIntent(input: InputState<IslandAction>): MovementIntent {
  const facing = latestHeld(input, DIRECTION_ACTIONS);
  const step = facing ? DIRECTION_STEPS[facing] : { dx: 0, dy: 0 };
  return { dx: step.dx, dy: step.dy, run: isHeld(input, 'run'), facing };
}
