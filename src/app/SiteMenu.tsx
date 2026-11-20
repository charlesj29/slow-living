import type { JSX } from 'react';
import { Link } from 'react-router';

/** Small floating navigation shown over the full-screen world. */
export function SiteMenu(): JSX.Element {
  return (
    <nav className="site-menu" aria-label="Site">
      <Link to="/games">Games</Link>
    </nav>
  );
}
