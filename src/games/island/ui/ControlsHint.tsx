import type { JSX } from 'react';
import { useIslandUiStore } from '../state';
import './islandUi.css';

/** A reminder of the controls along the bottom; it fades away once the player starts walking. */
export function ControlsHint(): JSX.Element {
  const hasStartedWalking = useIslandUiStore((state) => state.hasStartedWalking);
  return (
    <div
      className={`island-hud-panel island-controls-hint${hasStartedWalking ? ' is-faded' : ''}`}
      aria-hidden={hasStartedWalking}
    >
      WASD / arrow keys: walk · Shift: run · + / −: zoom
    </div>
  );
}
