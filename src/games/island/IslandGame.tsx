import { useLayoutEffect, useMemo, type JSX } from 'react';
import { CHILL_TUNE } from './assets/chillTune';
import { ISLAND_CONFIG } from './core/config';
import { createGameState } from './core/game/gameState';
import { loadWorld } from './loadWorld';
import { GameCanvas } from './render/GameCanvas';
import { useIslandUiStore } from './state';
import { ControlsHint } from './ui/ControlsHint';
import { DayNightToggle } from './ui/DayNightToggle';
import { DebugOverlay } from './ui/DebugOverlay';
import { DevSeedBadge } from './ui/DevSeedBadge';
import { DialogBox } from './ui/DialogBox';
import { IslandSwitcher } from './ui/IslandSwitcher';
import { MusicToggle } from './ui/MusicToggle';
import { PortfolioPanel } from './ui/PortfolioPanel';
import { ResumeButton, ResumeView } from './ui/ResumeView';
import { ScreenFade } from './ui/ScreenFade';
import { StudioVisitMemory } from './ui/StudioVisitMemory';
import { WorldErrorPanel } from './ui/WorldErrorPanel';
import { ZoomButtons } from './ui/ZoomButtons';

export interface IslandGameProps {
  /** A generated island for this seed; undefined = the baked home island. */
  readonly seed?: number;
  /** Asked for another island (dice button or R); the page picks a seed. */
  readonly onNewIsland: () => void;
  /** Asked to go back to the home island. */
  readonly onHome: () => void;
}

/** Loads the world, creates the simulation, and composes the render layer (canvas) and UI overlays. */
export function IslandGame({ seed, onNewIsland, onHome }: IslandGameProps): JSX.Element {
  // Loading is synchronous and fast (parse a few ms, generating a seed ~40 ms).
  const result = useMemo(() => loadWorld(seed), [seed]);
  // The simulation lives in a plain mutable object, created once per world and
  // shared by the canvas (which drives it) and the overlays (which read it).
  const game = useMemo(
    () => (result.ok ? createGameState(result.world, ISLAND_CONFIG) : null),
    [result],
  );

  // A new island starts outdoors with no message, and fades in.
  useLayoutEffect(() => {
    const ui = useIslandUiStore.getState();
    ui.setMap(game?.mapId ?? 'island');
    ui.setDialogMessage(null);
    ui.closePanel();
    ui.setResumeOpen(false);
    ui.setScreenDark(false);
  }, [game]);

  const switcher = (
    <IslandSwitcher
      key={seed ?? 'home'}
      isHome={seed === undefined}
      onNewIsland={onNewIsland}
      onHome={onHome}
    />
  );
  if (!result.ok || !game) {
    return (
      <>
        <WorldErrorPanel
          title={result.ok ? 'The game could not start' : result.title}
          details={result.ok ? [] : result.details}
        />
        <div className="island-hud-stack">{switcher}</div>
      </>
    );
  }
  return (
    <>
      <GameCanvas game={game} />
      <DebugOverlay game={game} />
      <ScreenFade />
      <StudioVisitMemory />
      <DialogBox />
      <div className="island-bottom-right">
        <ZoomButtons />
        <ControlsHint />
      </div>
      {/* The top-left buttons, in one column. */}
      <div className="island-hud-stack">
        <DayNightToggle />
        <MusicToggle song={CHILL_TUNE} />
        <ResumeButton />
        {switcher}
        {import.meta.env.DEV && seed !== undefined && <DevSeedBadge seed={seed} />}
      </div>
      <ResumeView />
      {/* Last, so it covers the buttons too while open. */}
      <PortfolioPanel />
    </>
  );
}
