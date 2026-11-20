import type { JSX } from 'react';
import './islandUi.css';

/** TEMPORARY (M2): explains the free-look camera until the player arrives in M3. */
export function LookAroundHint(): JSX.Element {
  return (
    <div className="island-hud-panel island-controls-hint">
      Arrow keys / WASD: look around · + / −: zoom
    </div>
  );
}
