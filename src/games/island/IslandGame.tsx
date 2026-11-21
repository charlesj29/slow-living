import { useMemo, type JSX } from 'react';
import { CHILL_TUNE } from './assets/chillTune';
import { ISLAND_CONFIG } from './core/config';
import { createGameState } from './core/game/gameState';
import { loadWorld } from './loadWorld';
import { GameCanvas } from './render/GameCanvas';
import { ControlsHint } from './ui/ControlsHint';
import { DebugOverlay } from './ui/DebugOverlay';
import { DialogBox } from './ui/DialogBox';
import { DevSeedBadge } from './ui/DevSeedBadge';
import { KeyboardNotice } from './ui/KeyboardNotice';
import { MusicToggle } from './ui/MusicToggle';
import { WorldErrorPanel } from './ui/WorldErrorPanel';

export interface IslandGameProps {
  /**
   * Dev-only authoring preview: generate this seed live instead of loading
   * the baked island. Leave undefined in production.
   */
  readonly devSeed?: number;
}

/** Loads the world, creates the simulation, and composes the render layer (canvas) and UI overlays. */
export function IslandGame({ devSeed }: IslandGameProps): JSX.Element {
  // Loading is synchronous and fast (parse ~5 ms, dev generation ~60 ms).
  const result = useMemo(() => loadWorld(devSeed), [devSeed]);
  // The simulation lives in a plain mutable object, created once per world and
  // shared by the canvas (which drives it) and the overlays (which read it).
  const game = useMemo(
    () => (result.ok ? createGameState(result.world, ISLAND_CONFIG) : null),
    [result],
  );

  if (!result.ok || !game) {
    return (
      <WorldErrorPanel
        title={result.ok ? 'The game could not start' : result.title}
        details={result.ok ? [] : result.details}
      />
    );
  }
  return (
    <>
      <GameCanvas game={game} />
      <ControlsHint />
      <DebugOverlay game={game} />
      <DialogBox />
      <KeyboardNotice />
      <MusicToggle song={CHILL_TUNE} />
      {devSeed !== undefined && <DevSeedBadge seed={devSeed} />}
    </>
  );
}
