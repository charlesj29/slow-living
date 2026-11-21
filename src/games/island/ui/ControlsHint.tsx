import type { JSX } from 'react';
import { isTouchFirst } from '../device';
import { useIslandUiStore } from '../state';
import './islandUi.css';

const KEYBOARD_HINT =
  'WASD / arrows: walk · Shift: run · Space: interact · + / −: zoom · M: music · R: new island';
const TOUCH_HINT = 'Tap to walk · tap people and things to interact';

/** A reminder of the controls along the bottom; it fades away once the player starts walking. */
export function ControlsHint(): JSX.Element {
  const hasStartedWalking = useIslandUiStore((state) => state.hasStartedWalking);
  return (
    <div
      className={`island-hud-panel island-controls-hint${hasStartedWalking ? ' is-faded' : ''}`}
      aria-hidden={hasStartedWalking}
    >
      {isTouchFirst() ? TOUCH_HINT : KEYBOARD_HINT}
    </div>
  );
}
