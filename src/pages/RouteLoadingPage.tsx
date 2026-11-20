import type { JSX } from 'react';

/** Shown on first load while a lazy route (e.g. a game and Three.js) is downloading. */
export function RouteLoadingPage(): JSX.Element {
  return (
    <div className="page" aria-busy="true">
      <p>Loading…</p>
    </div>
  );
}
