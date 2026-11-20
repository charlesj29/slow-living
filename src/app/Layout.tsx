import type { JSX } from 'react';
import { NavLink, Outlet } from 'react-router';

export function Layout(): JSX.Element {
  return (
    <div className="layout">
      <header className="layout__header">
        <NavLink to="/" className="layout__brand">
          Games Site
        </NavLink>
        <nav className="layout__nav">
          <NavLink to="/" end>
            World
          </NavLink>
          <NavLink to="/games">Games</NavLink>
        </nav>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  );
}
