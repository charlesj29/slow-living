import type { JSX } from 'react';
import { IslandGame } from '@/games/island';

export function IslandGamePage(): JSX.Element {
  return (
    <div className="game-page">
      <IslandGame />
    </div>
  );
}
