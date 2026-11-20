import type { JSX } from 'react';
import { useSearchParams } from 'react-router';
import { IslandGame } from '@/games/island';
import { parseSeed } from '@/shared/engine/random';

/** The landing page: visitors arrive straight in the island, full screen, with no site chrome. */
export function WorldPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  // `?seed=` previews a freshly generated island while authoring; production
  // builds ignore it and always show the baked island.
  const devSeed = import.meta.env.DEV
    ? (parseSeed(searchParams.get('seed')) ?? undefined)
    : undefined;

  return (
    <div className="world-page">
      <IslandGame devSeed={devSeed} />
    </div>
  );
}
