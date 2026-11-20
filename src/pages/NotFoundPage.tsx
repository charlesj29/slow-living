import type { JSX } from 'react';
import { Link } from 'react-router';

export function NotFoundPage(): JSX.Element {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p>
        <Link to="/">Back to the island</Link>
      </p>
    </div>
  );
}
