import { useMemo, type JSX } from 'react';
import { loadWorld } from './loadWorld';
import { GameCanvas } from './render/GameCanvas';
import { DevSeedBadge } from './ui/DevSeedBadge';
import { ControlsHint } from './ui/ControlsHint';
import { WorldErrorPanel } from './ui/WorldErrorPanel';

export interface IslandGameProps {
  /**
   * Dev-only authoring preview: generate this seed live instead of loading
   * the baked island. Leave undefined in production.
   */
  readonly devSeed?: number;
}

/** Loads the world and composes the game's render layer (canvas) and UI layer (overlays). */
export function IslandGame({ devSeed }: IslandGameProps): JSX.Element {
  // Loading is synchronous and fast (parse ~5 ms, dev generation ~60 ms).
  const result = useMemo(() => loadWorld(devSeed), [devSeed]);

  if (!result.ok) {
    return <WorldErrorPanel title={result.title} details={result.details} />;
  }
  return (
    <>
      <GameCanvas world={result.world} />
      <ControlsHint />
      {devSeed !== undefined && <DevSeedBadge seed={devSeed} />}
    </>
  );
}
