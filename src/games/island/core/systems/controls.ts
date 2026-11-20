import { isHeld, latestHeld, type InputState, type KeyBindings } from '@/shared/engine/input';
import type { Direction } from '../entities/player';

export type IslandAction = Direction | 'run';

/** Arrow keys or WASD to walk; either Shift to run. */
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
};

const DIRECTION_ACTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'];

export interface MovementIntent {
  /** −1, 0 or 1 on each axis (map coordinates: +y is down). */
  readonly dx: number;
  readonly dy: number;
  readonly run: boolean;
  /** The most recently pressed direction still held: the way the player faces. */
  readonly facing: Direction | undefined;
}

export function readMovementIntent(input: InputState<IslandAction>): MovementIntent {
  const held = (action: IslandAction): number => (isHeld(input, action) ? 1 : 0);
  return {
    dx: held('right') - held('left'),
    dy: held('down') - held('up'),
    run: isHeld(input, 'run'),
    facing: latestHeld(input, DIRECTION_ACTIONS),
  };
}
