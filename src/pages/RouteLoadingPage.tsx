import type { JSX } from 'react';

/** Full-screen loading screen shown while a lazy route (the world and Three.js) downloads. */
export function RouteLoadingPage(): JSX.Element {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-screen__mark" aria-hidden="true" />
      <p>Loading the island…</p>
    </div>
  );
}
