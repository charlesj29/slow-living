import type { JSX } from 'react';
import './islandUi.css';

interface WorldErrorPanelProps {
  readonly title: string;
  readonly details: readonly string[];
}

/** Shown instead of the game when the world can't be loaded or generated. */
export function WorldErrorPanel({ title, details }: WorldErrorPanelProps): JSX.Element {
  return (
    <div className="island-error" role="alert">
      <h2>{title}</h2>
      <ul>
        {details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </div>
  );
}
