import type { JSX } from 'react';
import './islandUi.css';

interface SeedLabelProps {
  readonly seed: number;
}

/** Shows the world seed so a map can be shared or reproduced via `?seed=`. */
export function SeedLabel({ seed }: SeedLabelProps): JSX.Element {
  return (
    <div className="island-hud-panel island-seed-label">
      Seed <strong>{seed}</strong>
    </div>
  );
}
