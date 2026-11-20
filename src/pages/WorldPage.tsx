import { useEffect, type JSX } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { IslandGame } from '@/games/island';
import { createRandomSeed, parseSeed } from '@/shared/engine/random';

/** Dev only: R jumps to a freshly generated preview island (authoring tool). */
const PREVIEW_KEY = 'KeyR';

/** The landing page: visitors arrive straight in the island, full screen, with no site chrome. */
export function WorldPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // `?seed=` previews a freshly generated island while authoring; production
  // builds ignore it and always show the baked island.
  const devSeed = import.meta.env.DEV
    ? (parseSeed(searchParams.get('seed')) ?? undefined)
    : undefined;

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code !== PREVIEW_KEY || event.ctrlKey || event.metaKey || event.altKey) return;
      void navigate(`/?seed=${String(createRandomSeed())}`);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return (
    <div className="world-page">
      <IslandGame devSeed={devSeed} />
    </div>
  );
}
