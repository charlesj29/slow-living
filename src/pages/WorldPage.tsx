import { useCallback, type JSX } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { IslandGame } from '@/games/island';
import { createRandomSeed, parseSeed } from '@/shared/engine/random';

/**
 * The landing page: visitors arrive straight in the island, full screen, with
 * no site chrome. `/` is the home island; `/?seed=N` is a generated one, so an
 * island someone liked can be shared as a link.
 */
export function WorldPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const seed = parseSeed(searchParams.get('seed')) ?? undefined;

  const visitNewIsland = useCallback(() => {
    void navigate(`/?seed=${String(createRandomSeed())}`);
  }, [navigate]);
  const goHome = useCallback(() => {
    void navigate('/');
  }, [navigate]);

  return (
    <div className="world-page">
      <IslandGame seed={seed} onNewIsland={visitNewIsland} onHome={goHome} />
    </div>
  );
}
