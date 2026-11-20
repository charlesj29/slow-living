import { useState, type JSX } from 'react';
import { useSearchParams } from 'react-router';
import { IslandGame } from '@/games/island';
import { createRandomSeed, parseSeed } from '@/shared/engine/random';

export function IslandGamePage(): JSX.Element {
  const [searchParams] = useSearchParams();
  // Chosen once per visit, so re-renders don't reroll the world when no seed is given.
  const [randomSeed] = useState(createRandomSeed);
  const seed = parseSeed(searchParams.get('seed')) ?? randomSeed;

  return (
    <div className="game-page">
      <IslandGame seed={seed} />
    </div>
  );
}
