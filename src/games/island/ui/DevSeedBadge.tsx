import type { JSX } from 'react';
import './islandUi.css';

interface DevSeedBadgeProps {
  readonly seed: number;
}

/** Marks a dev-only generated preview, so it's never mistaken for the real island. */
export function DevSeedBadge({ seed }: DevSeedBadgeProps): JSX.Element {
  return (
    <div className="island-hud-panel island-dev-badge">
      Dev preview · seed <strong>{seed}</strong>
    </div>
  );
}
