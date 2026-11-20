import type { JSX } from 'react';
import { useSearchParams } from 'react-router';
import { SiteMenu } from '@/app/SiteMenu';
import { IslandGame } from '@/games/island';
import { parseSeed } from '@/shared/engine/random';

/** The landing page: the island fills the screen; site navigation lives in a small menu. */
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
      <SiteMenu />
    </div>
  );
}
