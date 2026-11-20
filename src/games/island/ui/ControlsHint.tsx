import type { JSX } from 'react';
import './islandUi.css';

/** A small reminder of the controls along the bottom of the screen. */
export function ControlsHint(): JSX.Element {
  return (
    <div className="island-hud-panel island-controls-hint">
      WASD / arrow keys: walk · Shift: run · + / −: zoom
    </div>
  );
}
