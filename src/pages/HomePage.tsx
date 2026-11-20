import type { JSX } from 'react';
import { Link } from 'react-router';

export function HomePage(): JSX.Element {
  return (
    <div className="page">
      <h1>Welcome</h1>
      <p>A small collection of browser games built with React and Three.js.</p>
      <p>
        <Link to="/games">Browse the games →</Link>
      </p>
    </div>
  );
}
