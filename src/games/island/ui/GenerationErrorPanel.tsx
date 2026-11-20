import type { JSX } from 'react';
import type { ValidationIssue } from '../core/generation/validate';
import './islandUi.css';

interface GenerationErrorPanelProps {
  readonly seed: number;
  readonly attempts: number;
  readonly issues: readonly ValidationIssue[];
}

/** Shown instead of the game when no valid island could be generated. */
export function GenerationErrorPanel({
  seed,
  attempts,
  issues,
}: GenerationErrorPanelProps): JSX.Element {
  return (
    <div className="island-error" role="alert">
      <h2>Couldn’t generate an island</h2>
      <p>
        Seed <strong>{seed}</strong> produced no valid map after {attempts} attempts. Try another
        seed, e.g. <code>?seed=42</code>.
      </p>
      <ul>
        {issues.map((issue) => (
          <li key={issue.code}>{issue.message}</li>
        ))}
      </ul>
    </div>
  );
}
