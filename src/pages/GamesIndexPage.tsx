import type { JSX } from 'react';
import { Link } from 'react-router';
import { GAME_CATALOG } from '@/games/catalog';

export function GamesIndexPage(): JSX.Element {
  return (
    <div className="page">
      <h1>Games</h1>
      <ul className="game-grid">
        {GAME_CATALOG.map((game) => (
          <li key={game.id}>
            <Link to={game.path} className="game-card">
              <h2>{game.title}</h2>
              <p>{game.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
